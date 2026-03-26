import axios from "axios";
import https from "https";
import { Op, QueryTypes } from "sequelize";
import { CekTrans } from "../Transaksi/CekTransaksi.js";
import MTrans from "../../../cfg/model/MTrans.js";
import MPermit from "../../../cfg/model/MPermit.js";
import MHRUser from "../../../cfg/model/HRGA/User.js";
import HRGA from "../../../cfg/conn/HRGA.js";

const normalizeStatus = (value) => String(value || "").trim().toLowerCase();
const toDateOnly = (value) => {
 const dt = new Date(value);
 if (Number.isNaN(dt.getTime())) return null;
 dt.setHours(0, 0, 0, 0);
 return dt;
};
const isTodayWithinRange = (start, end) => {
 const startDate = toDateOnly(start);
 const endDate = toDateOnly(end);
 if (!startDate || !endDate) return false;
 const today = new Date();
 today.setHours(0, 0, 0, 0);
 return startDate <= today && today <= endDate;
};
const resolveFlowStatus = ({ lastStatus, startDate, endDate }) => {
 const status = normalizeStatus(lastStatus);
 if (!status) return "In";
 if (status === "in") return "Out";
 if (status === "out") {
  return isTodayWithinRange(startDate, endDate) ? "In" : "Out";
 }
 return "In";
};

const pickFirstValue = (source = {}, keys = []) => {
 for (const key of keys) {
  const value = source?.[key];
  if (value !== null && value !== undefined && String(value).trim() !== "") {
   return value;
  }
 }
 return null;
};

const parseContractorWorkers = (value) => {
 if (!value) return [];

 try {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  if (!Array.isArray(parsed)) return [];

  return parsed.map((worker) => {
   if (typeof worker === "string") {
    return { nama: worker };
   }

   return {
    ...worker,
    nama: worker?.nama_pekerja || worker?.nama || worker?.name || "",
   };
  });
 } catch {
  return [];
 }
};

const normalizeQrCandidates = (rawValue) => {
 const candidates = new Set();

 const add = (value) => {
  if (value === null || value === undefined) return;
  const normalized = String(value).trim();
  if (!normalized) return;
  candidates.add(normalized);
  try {
   const decoded = decodeURIComponent(normalized);
   if (decoded && decoded !== normalized) {
    candidates.add(decoded.trim());
   }
  } catch {
   // Ignore malformed URI sequences.
  }
 };

 add(rawValue);

 try {
  const parsed = JSON.parse(rawValue);
  if (parsed && typeof parsed === "object") {
   [
    parsed.token,
    parsed.TOKEN,
    parsed.qr_data,
    parsed.QR_DATA,
    parsed.no_permit,
    parsed.NOPERMIT,
    parsed.permit_no,
    parsed.PERMITNO,
    parsed.trans_id,
    parsed.TRANSID,
    parsed.visitor_id,
    parsed.VISITOR_ID,
    parsed.id_visitor,
    parsed.ID_VISITOR,
    parsed.card_id,
    parsed.CARDID,
   ].forEach(add);
  }
 } catch {
  // Ignore non-JSON QR payload.
 }

 String(rawValue)
  .split(/[\s|,;/]+/)
  .forEach(add);

 try {
  const parsedUrl = new URL(String(rawValue).trim());
  add(parsedUrl.href);
  add(parsedUrl.pathname);

  const pathSegments = parsedUrl.pathname
   .split("/")
   .map((segment) => segment.trim())
   .filter(Boolean);

  pathSegments.forEach(add);

  for (const [, value] of parsedUrl.searchParams.entries()) {
   add(value);
  }

  [
   parsedUrl.searchParams.get("token"),
   parsedUrl.searchParams.get("TOKEN"),
   parsedUrl.searchParams.get("nopermit"),
   parsedUrl.searchParams.get("NOPERMIT"),
   parsedUrl.searchParams.get("permit_no"),
   parsedUrl.searchParams.get("PERMITNO"),
   parsedUrl.searchParams.get("id"),
   parsedUrl.searchParams.get("ID"),
  ].forEach(add);

  const permitIndex = pathSegments.findIndex((segment) => segment.toLowerCase() === "permit");
  if (permitIndex >= 0 && pathSegments[permitIndex + 1]) {
   add(pathSegments[permitIndex + 1]);
  }

  const contractorPermitIndex = pathSegments.findIndex(
   (segment) => segment.toLowerCase() === "contractor-permit"
  );
  if (contractorPermitIndex >= 0 && pathSegments[contractorPermitIndex + 1]) {
   add(pathSegments[contractorPermitIndex + 1]);
  }
 } catch {
  // Ignore non-URL QR payloads.
 }

 const visitorPattern = /^visitor-(.+)$/i.exec(String(rawValue).trim());
 if (visitorPattern?.[1]) add(visitorPattern[1]);

 const contractorPattern = /^\/?contractor-permit\/([^/?#]+)$/i.exec(String(rawValue).trim());
 if (contractorPattern?.[1]) add(contractorPattern[1]);

 const publicPermitPattern = /\/api\/contractor\/public\/permit\/([^/?#]+)/i.exec(String(rawValue).trim());
 if (publicPermitPattern?.[1]) add(publicPermitPattern[1]);

 return [...candidates];
};

const findPermitPayload = async (rawToken) => {
 const candidates = normalizeQrCandidates(rawToken);

 const permit = await MPermit.findOne({
  where: {
   [Op.or]: [
    { TOKEN: { [Op.in]: candidates } },
    { NOPERMIT: { [Op.in]: candidates } },
   ],
  },
  order: [["updatedAt", "DESC"]],
  raw: true,
 });

 if (!permit) {
  const permitRows = await HRGA.query(
   `
    SELECT TOP 1 *
    FROM [dbo].[contractor_permits]
    WHERE [token] IN (:candidates)
       OR [no_permit] IN (:candidates)
    ORDER BY COALESCE([updated_at], [created_at]) DESC
   `,
   {
    replacements: { candidates },
    type: QueryTypes.SELECT,
   }
  );

  const contractorPermit = Array.isArray(permitRows) ? permitRows[0] : null;
  if (!contractorPermit) return null;

  const permitToken = pickFirstValue(contractorPermit, ["token", "permit_token"]) || rawToken;
  const workers = parseContractorWorkers(contractorPermit.daftar_pekerja);
  const workerName = workers[0]?.nama || "";
  const company =
   pickFirstValue(contractorPermit, ["perusahaan", "company", "company_name"]) ||
   "Contractor";
  const purpose =
   pickFirstValue(contractorPermit, ["pekerjaan", "purpose"]) ||
   "Contractor Permit";
  const location =
   pickFirstValue(contractorPermit, ["lokasi", "location"]) ||
   null;
  const permitType =
   pickFirstValue(contractorPermit, ["tipe_pekerjaan", "type", "permit_type", "job_type"]) ||
   "contractor";
  const permitNo = pickFirstValue(contractorPermit, ["no_permit", "permit_no", "nopermit"]) || null;
  const startDate =
   pickFirstValue(contractorPermit, ["tgl_mulai", "mulai", "start_date", "created_at"]) ||
   null;
  const endDate =
   pickFirstValue(contractorPermit, ["tgl_akhir", "akhir", "end_date", "updated_at"]) ||
   null;
  const startTime = pickFirstValue(contractorPermit, ["jam_mulai", "start_time"]) || null;
  const endTime = pickFirstValue(contractorPermit, ["jam_akhir", "end_time"]) || null;
  const statusApproval = pickFirstValue(contractorPermit, ["status_approval", "approval_status", "status"]) || null;

  const picUserNik = pickFirstValue(contractorPermit, ["pic_user"]);
  const picHseNik = pickFirstValue(contractorPermit, ["pic_hse"]);
  const [picUser, picHse] = await Promise.all([
   picUserNik
    ? MHRUser.findOne({
       where: { NIK: picUserNik },
       raw: true,
      })
    : null,
   picHseNik
    ? MHRUser.findOne({
       where: { NIK: picHseNik },
       raw: true,
      })
    : null,
  ]);

  const picHseName =
   picHse?.Nama ||
   pickFirstValue(contractorPermit, ["pic_hse_nama", "pic_hse_name"]) ||
   picHseNik ||
   "";
  const penerima = picUser?.Nama || picUserNik || "";

  const contractorToken = permitToken || rawToken;
  const flowStatus = resolveFlowStatus({
   lastStatus: statusApproval,
   startDate,
   endDate,
  });

  return {
   transId: contractorPermit?.id || contractorToken,
   cardId: permitToken || permitNo || contractorToken,
   nama: workerName,
   perusahaan: company,
   penerima,
   jumlah: Math.max(workers.length, 1),
   keperluan: purpose,
   status: flowStatus,
   parkId: null,
   display: location || "Contractor",
   jenis: permitType,
   platNomor: null,
   createdAt: contractorPermit?.created_at || null,
   updatedAt: contractorPermit?.updated_at || null,
   startDate,
   endDate,
   requestVisitor: null,
   source: "contractor",
   type: "contractor",
   token: contractorToken,
   permitNo,
   location,
   contractorDetails: {
    noPermit: permitNo,
    perusahaan: company,
    lokasi: location,
    pekerjaan: purpose,
    tipePekerjaan: permitType,
    tglMulai: startDate,
    tglAkhir: endDate,
    jamMulai: startTime,
    jamAkhir: endTime,
    statusApproval,
    picHseNama: picHseName,
    permitToken,
    workers,
    approvals: statusApproval ? [{ status: statusApproval }] : [],
   },
   transactionCardToken: {
    CARDID: permitToken || permitNo || contractorToken,
    NAMA: workerName,
    PERUSAHAAN: company,
    KARYAWAN: penerima,
    JUMLAH: Math.max(workers.length, 1),
    KEPERLUAN: purpose,
    STATUS: flowStatus,
    TOKEN: contractorToken,
    STARTDATE: startDate,
    ENDDATE: endDate,
    LOCATION: location,
    PERMITNO: permitNo,
    TYPE: permitType,
    JAMMULAI: startTime,
    JAMAKHIR: endTime,
   },
  };
 }

 const picUser = permit.PICUSER
  ? await MHRUser.findOne({
     where: { NIK: permit.PICUSER },
     raw: true,
    })
  : null;

 const now = new Date();
 const startDate = toDateOnly(permit.MULAI);
 const endDate = toDateOnly(permit.AKHIR);

 let permitStatus = "scheduled";
 if (startDate && endDate) {
  if (now < startDate) permitStatus = "scheduled";
  else if (now > endDate) permitStatus = "expired";
  else permitStatus = "active";
 } else if (startDate && !endDate) {
  permitStatus = now < startDate ? "scheduled" : "active";
 }

 return {
  transId: permit.NOPERMIT || permit.TOKEN || rawToken,
  cardId: permit.NOPERMIT || permit.TOKEN || rawToken,
  nama: permit.PEKERJA || "",
  perusahaan: permit.PERUSAHAAN || "",
  penerima: picUser?.Nama || permit.PICUSER || "",
  jumlah: 1,
  keperluan: permit.PEKERJAAN || "",
  status: permitStatus,
  parkId: null,
  display: permit.LOKASI || null,
  jenis: permit.TYPE || null,
  platNomor: null,
  createdAt: permit.createdAt || null,
  updatedAt: permit.updatedAt || null,
  startDate: permit.MULAI || null,
  endDate: permit.AKHIR || null,
  requestVisitor: null,
  source: "contractor",
  type: "contractor",
  token: permit.TOKEN || rawToken,
  permitNo: permit.NOPERMIT || null,
  location: permit.LOKASI || null,
  transactionCardToken: {
   CARDID: permit.NOPERMIT || permit.TOKEN || rawToken,
   NAMA: permit.PEKERJA || "",
   PERUSAHAAN: permit.PERUSAHAAN || "",
   KARYAWAN: picUser?.Nama || permit.PICUSER || "",
   JUMLAH: 1,
   KEPERLUAN: permit.PEKERJAAN || "",
   STATUS: permitStatus,
   TOKEN: permit.TOKEN || rawToken,
   STARTDATE: permit.MULAI || null,
   ENDDATE: permit.AKHIR || null,
   LOCATION: permit.LOKASI || null,
   PERMITNO: permit.NOPERMIT || null,
   TYPE: permit.TYPE || null,
  },
 };
};

const mapExternalPermitPayload = (permit, rawToken) => {
 if (!permit || typeof permit !== "object") return null;
 if (permit.success === false) return null;

 const permitToken =
  permit.token ||
  permit.permit_token ||
  permit.permitToken ||
  rawToken;
 const permitNo =
  permit.no_permit ||
  permit.NOPERMIT ||
  permit.permit_no ||
  permit.permitNo ||
  null;
 const workerName =
  permit.pekerja ||
  permit.worker_name ||
  permit.workerName ||
  permit.visitor_name ||
  permit.name ||
  "";
 const company =
  permit.perusahaan ||
  permit.company ||
  permit.company_name ||
  "";
 const permitJobType =
  permit.tipe_pekerjaan ||
  permit.job_type ||
  permit.jobType ||
  "";
 const purpose =
  permit.pekerjaan ||
  permit.purpose ||
  "";
 const picName =
  permit.pic_name ||
  permit.picName ||
  permit.pic_user_name ||
  permit.picUserName ||
  permit.pic_user ||
  permit.picUser ||
  "";
 const picHse = permit.pic_hse || permit.picHse || {};
 const picHseName = picHse.nama || picHse.name || "";
 const location = permit.lokasi || permit.location || null;
 const permitType = permit.type || permit.permit_type || permit.permitType || permitJobType || null;
 const startDate = permit.mulai || permit.start_date || permit.startDate || permit.tgl_mulai || null;
 const endDate = permit.akhir || permit.end_date || permit.endDate || permit.tgl_akhir || null;
 const startTime = permit.jam_mulai || permit.start_time || permit.startTime || null;
 const endTime = permit.jam_akhir || permit.end_time || permit.endTime || null;
 const statusApproval = permit.status_approval || permit.statusApproval || null;
 const workers = Array.isArray(permit.daftar_pekerja)
  ? permit.daftar_pekerja
  : Array.isArray(permit.workers)
   ? permit.workers
   : [];
 const approvals = Array.isArray(permit.approvals) ? permit.approvals : [];
 const status = String(
  permit.status ||
   permit.permit_status ||
   (startDate || endDate ? "active" : "In")
 ).toLowerCase();
 const cardId = permitNo || permitToken || rawToken;

 return {
  transId: permitNo || permitToken || rawToken,
  cardId,
  nama: workerName,
  perusahaan: company,
  penerima: picName,
  jumlah: Number(permit.jumlah || 1),
  keperluan: purpose,
  status,
  parkId: null,
  display: location,
  jenis: permitType,
  platNomor: null,
  createdAt: permit.createdAt || permit.created_at || null,
  updatedAt: permit.updatedAt || permit.updated_at || null,
  startDate,
  endDate,
  requestVisitor: null,
  source: "contractor",
  type: "contractor",
  token: permitToken,
  permitNo,
  location,
  contractorDetails: {
   noPermit: permitNo,
   perusahaan: company,
   lokasi: location,
   pekerjaan: purpose,
   tipePekerjaan: permitJobType,
   tglMulai: startDate,
   tglAkhir: endDate,
   jamMulai: startTime,
   jamAkhir: endTime,
   statusApproval,
   picHseNama: picHseName,
   workers,
   approvals,
  },
  transactionCardToken: {
   CARDID: cardId,
   NAMA: workerName,
   PERUSAHAAN: company,
   KARYAWAN: picName,
   JUMLAH: Number(permit.jumlah || 1),
   KEPERLUAN: purpose,
   STATUS: status,
   TOKEN: permitToken,
   STARTDATE: startDate,
   ENDDATE: endDate,
   JAMMULAI: startTime,
   JAMAKHIR: endTime,
   LOCATION: location,
   PERMITNO: permitNo,
   TYPE: permitType,
  },
 };
};

const findExternalPermitPayload = async (rawToken) => {
 const baseUrl =
  process.env.CONTRACTOR_PUBLIC_API_BASE_URL ||
  process.env.CONTRACTOR_PUBLIC_BASE_URL ||
  process.env.CONTRACTOR_APP_URL;

 if (!baseUrl) return null;

 const requestUrl = `${String(baseUrl).replace(/\/$/, "")}/api/contractor/public/permit/${encodeURIComponent(rawToken)}`;

 try {
  const response = await axios.get(requestUrl, {
   headers: {
    Accept: "application/json",
   },
   httpsAgent: new https.Agent({
    rejectUnauthorized: false,
   }),
  });

  const payload =
   response?.data?.data ||
   response?.data?.permit ||
   response?.data;

  return mapExternalPermitPayload(payload, rawToken);
 } catch (error) {
  return null;
 }
};

export const CekQR = async (req, res) => {
 const { token } = req.body;

 try {
  // Panggil API eksternal
  const response = await axios.post(
   "https://pik1svr008.local.ikoito.co.id:5002/visitor/getVisitorAttendanceByToken",
   { token },
   {
    headers: {
     "Content-Type": "application/json",
     Accept: "application/json",
    },
    httpsAgent: new https.Agent({
     rejectUnauthorized: false,
    }),
   }
  );

  const images = Array.isArray(response?.data?.images) ? response.data.images : [];
  const findImageByKeyword = (keywordList = []) =>
   images.find((img) => {
    const fileName = String(img?.name || "").toLowerCase();
    const originalName = String(img?.originalName || "").toLowerCase();
    return keywordList.some((keyword) => fileName.includes(keyword) || originalName.includes(keyword));
   }) || null;

  const ktpImage = findImageByKeyword(["ktp", "identity", "identitas"]);
  const selfieImage = findImageByKeyword(["foto", "selfie", "face", "wajah"]);

  if (response.status === 200) {
   const cekTransaksi = await CekTrans({ body: { ret: "ret", TRANSID: response.data.tokenAttn } });
   let latestTransaksi = cekTransaksi;
   if (cekTransaksi?.CARDID) {
    const latestByCard = await MTrans.findOne({
     where: { CARDID: cekTransaksi.CARDID },
     order: [["createdAt", "DESC"]],
     raw: true,
     nest: true,
    });
    if (latestByCard) {
      latestTransaksi = latestByCard;
    }
   }
   const requestVisitor = response?.data?.requestVisitor || {};
   const startDate = requestVisitor?.startDate || latestTransaksi?.MULAI || null;
   const endDate = requestVisitor?.endDate || latestTransaksi?.AKHIR || startDate;
   const flowStatus = resolveFlowStatus({
    lastStatus: latestTransaksi?.STATUS,
    startDate,
    endDate,
   });

   const payload = {
    transId: latestTransaksi?.TRANSID || response?.data?.tokenAttn || token || null,
    cardId: latestTransaksi?.CARDID || null,
    nama: latestTransaksi?.NAMA || response?.data?.nama || null,
    perusahaan: latestTransaksi?.PERUSAHAAN || requestVisitor?.perusahaan || null,
    penerima: latestTransaksi?.KARYAWAN || requestVisitor?.user?.nama || null,
    jumlah: Number(latestTransaksi?.JUMLAH || requestVisitor?.jumlahTamu || 1),
    keperluan: latestTransaksi?.KEPERLUAN || requestVisitor?.keperluan || null,
    KTP: latestTransaksi?.KTP || ktpImage || null,
    FOTO: latestTransaksi?.FOTO || selfieImage || null,
    status: normalizeStatus(latestTransaksi?.STATUS || ""),
    parkId: latestTransaksi?.PARKID || null,
    display: latestTransaksi?.DISPLAY || null,
    jenis: latestTransaksi?.JENIS || null,
    platNomor: latestTransaksi?.TNKB || null,
    createdAt: latestTransaksi?.createdAt || null,
    updatedAt: latestTransaksi?.updatedAt || null,
    startDate,
    endDate,
    requestVisitor,
    source: "qr",
    token: latestTransaksi?.TRANSID || response?.data?.tokenAttn || token || null,
   };

   return res.status(200).json({
    status: flowStatus,
    data: payload,
    token: payload.token,
   source: "qr",
  });
  }
 } catch (error) {
  const permitPayload = await findPermitPayload(token);

  if (permitPayload) {
   return res.status(200).json({
    status: permitPayload.status || "In",
    data: permitPayload,
    token: permitPayload.token,
    source: "contractor",
   });
  }

  const externalPermitPayload = await findExternalPermitPayload(token);
  if (externalPermitPayload) {
   return res.status(200).json({
    status: externalPermitPayload.status || "In",
    data: externalPermitPayload,
    token: externalPermitPayload.token,
    source: "contractor",
   });
  }

  console.error("CekQR Error:", error?.response?.data || error.message);
  return res.status(404).json({
   status: 0,
   msg:
    error?.response?.data?.message ||
    error?.response?.data?.msg ||
    "Token tidak ditemukan di visitor maupun contractor",
  });
 }
};
