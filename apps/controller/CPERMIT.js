import { Op, QueryTypes } from "sequelize";
import MPermit from "../../cfg/model/MPermit.js"
import moment from "moment";
import HRGA from "../../cfg/conn/HRGA.js";

const parsePermitWorkers = (value) => {
 try {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  if (!Array.isArray(parsed)) return [];

  return parsed
   .map((worker) => {
    if (typeof worker === "string") return worker.trim();
    return String(worker?.nama_pekerja || worker?.nama || worker?.name || "").trim();
   })
   .filter(Boolean);
 } catch {
  return [];
 }
};

export const ManagePermit = async (req, res) => {
 var PEKERJA = JSON.stringify(req.body.PEKERJA)
 if (req.body.STATUS === 'Add') {
  // console.log(req.body);
  var save = await MPermit.create({
   TOKEN: req.body.TOKEN,
   BULAN: moment(req.body.START).format('MMMM'),
   MULAI: req.body.MULAI,
   AKHIR: req.body.AKHIR,
   JAMMULAI: req.body.JAMMULAI,
   JAMAKHIR: req.body.JAMAKHIR,
   NOPERMIT: req.body.NOPERMIT,
   PERUSAHAAN: req.body.PERUSAHAAN,
   PEKERJAAN: req.body.PEKERJAAN,
   LOKASI: req.body.LOKASI,
   PICUSER: req.body.PICUSER,
   PICHSE: req.body.PICHSE,
   RANK: req.body.RANK,
   TYPE: req.body.TYPE,
   PEKERJA: PEKERJA,
   createdAt: moment().format('YYYY-MM-DD HH:MM')
  })
 } else if (req.body.STATUS === 'Upd') {
  var save = await MPermit.update(
   {
    BULAN: moment(req.body.START).format('MMMM'),
    MULAI: req.body.MULAI,
    AKHIR: req.body.AKHIR,
    JAMMULAI: req.body.JAMMULAI,
    JAMAKHIR: req.body.JAMAKHIR,
    NOPERMIT: req.body.NOPERMIT,
    PERUSAHAAN: req.body.PERUSAHAAN,
    PEKERJAAN: req.body.PEKERJAAN,
    LOKASI: req.body.LOKASI,
    PICUSER: req.body.PICUSER,
    PICHSE: req.body.PICHSE,
    RANK: req.body.RANK,
    TYPE: req.body.TYPE,
    PEKERJA: PEKERJA,
    updatedAt: moment().format('YYYY-MM-DD HH:MM')
   }, {
   where: {
    TOKEN: req.body.TOKEN,
   }
  }
  )
 } else if (req.body.STATUS === 'Del') {
  var save = await MPermit.destroy({ where: { TOKEN: req.body.TOKEN } })
 }

 if (save) {
  if (res !== 'ret') {
   res.json({ status: 1, msg: 'Success' })
  }
 }
}
export const FindPermitByToken = async (req, res) => {
 const data = []
 await MPermit.findOne({
  raw: true, nest: true,
  where: { TOKEN: req.body.TOKEN }
 })
  .then((hs) => {
   data.push(hs)
  })
  .catch((err) => {
   data.push({ status: 0, msg: err })
  })

 if (res === 'ret') {
  return (data[0])
 } else {
  res.json(data[0])
 }
}
export const FindPermitByMonth = async (req, res) => {
 try {
  console.log("FindPermitByMonth request:", req.body);
  const selectedStart = moment(req.body.START, "YYYY-MM-DD", true);
  const selectedEnd = moment(req.body.END, "YYYY-MM-DD", true);
  if (!selectedStart.isValid() || !selectedEnd.isValid()) {
   console.warn("FindPermitByMonth invalid range:", req.body);
   return res.json([]);
  }

  let contractorData = [];
  try {
   console.log("FindPermitByMonth HRGA range:", {
    startDate: selectedStart.format("YYYY-MM-DD"),
    endDate: selectedEnd.format("YYYY-MM-DD"),
   });

   const contractorPermits = await HRGA.query(
    `
     SELECT
      cp.[id],
      cp.[token],
      cp.[no_permit],
      cp.[bulan],
      cp.[perusahaan],
      cp.[tipe_pekerjaan],
      cp.[pekerjaan],
      cp.[lokasi],
      cp.[tgl_mulai],
      cp.[tgl_akhir],
      cp.[jam_mulai],
      cp.[jam_akhir],
      LEFT(CONVERT(VARCHAR(8), cp.[jam_mulai], 108), 5) AS [jam_mulai_text],
      LEFT(CONVERT(VARCHAR(8), cp.[jam_akhir], 108), 5) AS [jam_akhir_text],
      cp.[daftar_pekerja],
      cp.[pic_user],
      cp.[pic_hse],
      pu.[Nama] AS [pic_user_name],
      ph.[Nama] AS [pic_hse_name],
      cp.[created_at],
      cp.[updated_at]
     FROM [dbo].[contractor_permits] cp
     LEFT JOIN [dbo].[USER] pu
       ON LTRIM(RTRIM(CAST(pu.[NIK] AS VARCHAR(50)))) = LTRIM(RTRIM(CAST(cp.[pic_user] AS VARCHAR(50))))
     LEFT JOIN [dbo].[USER] ph
       ON LTRIM(RTRIM(CAST(ph.[NIK] AS VARCHAR(50)))) = LTRIM(RTRIM(CAST(cp.[pic_hse] AS VARCHAR(50))))
     WHERE CAST(cp.[tgl_mulai] AS DATE) <= :endDate
       AND CAST(cp.[tgl_akhir] AS DATE) >= :startDate
     ORDER BY cp.[tgl_mulai] DESC, cp.[id] DESC
    `,
    {
     replacements: {
      startDate: selectedStart.format("YYYY-MM-DD"),
      endDate: selectedEnd.format("YYYY-MM-DD"),
     },
     logging: (sql) => console.log("FindPermitByMonth HRGA SQL:", sql),
     type: QueryTypes.SELECT,
    }
   );

   console.log("FindPermitByMonth HRGA raw rows:", contractorPermits.length);
   if (contractorPermits.length > 0) {
    console.log("FindPermitByMonth HRGA first row:", contractorPermits[0]);
   }

   contractorData = contractorPermits
    .map((row, index) => ({
     TOKEN: String(row?.token || "").trim() || `HRGA-${index + 1}`,
     TAHUN: row?.tgl_mulai ? moment(row.tgl_mulai).format("YYYY") : "",
     BULAN: row?.bulan || (row?.tgl_mulai ? moment(row.tgl_mulai).format("MMMM") : ""),
     MULAI: row?.tgl_mulai ? moment(row.tgl_mulai).format("YYYY-MM-DD") : null,
     AKHIR: row?.tgl_akhir ? moment(row.tgl_akhir).format("YYYY-MM-DD") : null,
     JAMMULAI: row?.jam_mulai_text || null,
     JAMAKHIR: row?.jam_akhir_text || null,
     NOPERMIT: row?.no_permit || "",
     PERUSAHAAN: row?.perusahaan || "",
     PEKERJA: parsePermitWorkers(row?.daftar_pekerja),
     PEKERJAAN: row?.pekerjaan || "",
     LOKASI: row?.lokasi || "",
     TYPE: row?.tipe_pekerjaan || "",
     PICUSER: row?.pic_user_name || row?.pic_user || "",
     PICHSE: row?.pic_hse_name || row?.pic_hse || "",
     RANK: "",
     SOURCE: "HRGA",
    }))
    .filter((row) => {
     if (!row.MULAI) return false;
     const mulai = moment(row.MULAI, "YYYY-MM-DD", true);
     const akhir = row.AKHIR
      ? moment(row.AKHIR, "YYYY-MM-DD", true)
      : mulai;

     if (!mulai.isValid()) return false;
     if (!akhir.isValid()) return false;

     return mulai.isSameOrBefore(selectedEnd, "day") && akhir.isSameOrAfter(selectedStart, "day");
    });
  } catch (contractorError) {
   console.error("FindPermitByMonth contractor source error:", contractorError);
   console.error("FindPermitByMonth contractor source error detail:", contractorError?.message, contractorError?.original || contractorError?.parent || null);
  }

  console.log("FindPermitByMonth contractor rows:", contractorData.length);
  if (contractorData.length > 0) {
   console.log("FindPermitByMonth contractor mapped first row:", contractorData[0]);
  }

  const vmsPermits = await MPermit.findAll({
   raw: true,
   nest: true,
   where: {
    MULAI: {
     [Op.between]: [req.body.START, req.body.END],
    },
   },
   order: [["MULAI", "DESC"], ["NOPERMIT", "DESC"]],
  });

  const vmsData = vmsPermits.map((row) => {
   let pekerja = [];
   try {
    pekerja = Array.isArray(row.PEKERJA) ? row.PEKERJA : JSON.parse(row.PEKERJA || "[]");
   } catch {
    pekerja = [];
   }

   return {
    TOKEN: row.TOKEN || "",
    TAHUN: row.TAHUN || "",
    BULAN: row.BULAN || "",
    MULAI: row.MULAI || null,
    AKHIR: row.AKHIR || null,
    JAMMULAI: row.JAMMULAI || null,
    JAMAKHIR: row.JAMAKHIR || null,
    NOPERMIT: row.NOPERMIT || "",
    PERUSAHAAN: row.PERUSAHAAN || "",
    PEKERJA: pekerja,
    PEKERJAAN: row.PEKERJAAN || "",
    LOKASI: row.LOKASI || "",
    TYPE: row.TYPE || "",
    PICUSER: row.PICUSER || "",
    PICHSE: row.PICHSE || "",
    RANK: row.RANK || "",
    SOURCE: "VMS",
   };
  });

  console.log("FindPermitByMonth VMS rows:", vmsData.length);
  if (vmsData.length > 0) {
   console.log("FindPermitByMonth VMS first row:", vmsData[0]);
  }

  const mergedData = [...contractorData, ...vmsData].sort((a, b) => {
   const dateA = moment(a.MULAI, "YYYY-MM-DD", true);
   const dateB = moment(b.MULAI, "YYYY-MM-DD", true);
   return dateB.valueOf() - dateA.valueOf();
  });

  console.log("FindPermitByMonth total rows:", mergedData.length);
  if (mergedData.length > 0) {
   console.log("FindPermitByMonth merged first row:", mergedData[0]);
  }
  return res.json(mergedData);
 } catch (error) {
  console.error("FindPermitByMonth error:", error);
  console.error("FindPermitByMonth error detail:", error?.message, error?.original || error?.parent || null);
  return res.status(500).json({ message: "Gagal memuat permit" });
 }
}

export const FindContractorPermitByMonth = async (req, res) => {
 try {
  console.log("FindContractorPermitByMonth request:", req.body);

  const selectedStart = moment(req.body.START, "YYYY-MM-DD", true);
  const selectedEnd = moment(req.body.END, "YYYY-MM-DD", true);
  if (!selectedStart.isValid() || !selectedEnd.isValid()) {
   console.warn("FindContractorPermitByMonth invalid range:", req.body);
   return res.json([]);
  }

  const rows = await HRGA.query(
   `
    SELECT
     cp.[id],
     cp.[token],
     cp.[no_permit],
     cp.[bulan],
     cp.[perusahaan],
     cp.[tipe_pekerjaan],
     cp.[pekerjaan],
     cp.[lokasi],
     cp.[tgl_mulai],
     cp.[tgl_akhir],
     cp.[jam_mulai],
     cp.[jam_akhir],
     LEFT(CONVERT(VARCHAR(8), cp.[jam_mulai], 108), 5) AS [jam_mulai_text],
     LEFT(CONVERT(VARCHAR(8), cp.[jam_akhir], 108), 5) AS [jam_akhir_text],
     cp.[daftar_pekerja],
     cp.[pic_user],
     cp.[pic_hse],
     pu.[Nama] AS [pic_user_name],
     ph.[Nama] AS [pic_hse_name],
     cp.[created_at],
     cp.[updated_at]
    FROM [dbo].[contractor_permits] cp
    LEFT JOIN [dbo].[USER] pu
      ON LTRIM(RTRIM(CAST(pu.[NIK] AS VARCHAR(50)))) = LTRIM(RTRIM(CAST(cp.[pic_user] AS VARCHAR(50))))
    LEFT JOIN [dbo].[USER] ph
      ON LTRIM(RTRIM(CAST(ph.[NIK] AS VARCHAR(50)))) = LTRIM(RTRIM(CAST(cp.[pic_hse] AS VARCHAR(50))))
    WHERE CAST(cp.[tgl_mulai] AS DATE) <= :endDate
      AND CAST(cp.[tgl_akhir] AS DATE) >= :startDate
    ORDER BY cp.[tgl_mulai] DESC, cp.[id] DESC
   `,
   {
    replacements: {
     startDate: selectedStart.format("YYYY-MM-DD"),
     endDate: selectedEnd.format("YYYY-MM-DD"),
    },
    logging: (sql) => console.log("FindContractorPermitByMonth HRGA SQL:", sql),
    type: QueryTypes.SELECT,
   }
  );

  console.log("FindContractorPermitByMonth raw rows:", rows.length);
  if (rows.length > 0) {
   console.log("FindContractorPermitByMonth first row:", rows[0]);
  }

  const mapped = rows.map((row, index) => ({
   TOKEN: String(row?.token || "").trim() || `HRGA-${index + 1}`,
   TAHUN: row?.tgl_mulai ? moment(row.tgl_mulai).format("YYYY") : "",
   BULAN: row?.bulan || (row?.tgl_mulai ? moment(row.tgl_mulai).format("MMMM") : ""),
   MULAI: row?.tgl_mulai ? moment(row.tgl_mulai).format("YYYY-MM-DD") : null,
   AKHIR: row?.tgl_akhir ? moment(row.tgl_akhir).format("YYYY-MM-DD") : null,
   JAMMULAI: row?.jam_mulai_text || null,
   JAMAKHIR: row?.jam_akhir_text || null,
   NOPERMIT: row?.no_permit || "",
   PERUSAHAAN: row?.perusahaan || "",
   PEKERJA: parsePermitWorkers(row?.daftar_pekerja),
   PEKERJAAN: row?.pekerjaan || "",
   LOKASI: row?.lokasi || "",
   TYPE: row?.tipe_pekerjaan || "",
   PICUSER: row?.pic_user_name || row?.pic_user || "",
   PICHSE: row?.pic_hse_name || row?.pic_hse || "",
   RANK: "",
   CREATED_AT: row?.created_at || null,
   UPDATED_AT: row?.updated_at || null,
   SOURCE: "HRGA",
  }));

  console.log("FindContractorPermitByMonth mapped rows:", mapped.length);
  if (mapped.length > 0) {
   console.log("FindContractorPermitByMonth mapped first row:", mapped[0]);
  }

  return res.json(mapped);
 } catch (error) {
  console.error("FindContractorPermitByMonth error:", error);
  console.error("FindContractorPermitByMonth error detail:", error?.message, error?.original || error?.parent || null);
  return res.status(500).json({ message: "Gagal memuat contractor permit HRGA" });
 }
}

export const DeleteContractorPermit = async (req, res) => {
 try {
  const requesterNIK = String(req.user?.NIK || "").trim();
  if (requesterNIK !== "1801046") {
   return res.status(403).json({ status: 0, msg: "Forbidden: Anda tidak memiliki akses delete contractor permit." });
  }

  const token = String(req.body?.TOKEN || req.body?.token || "").trim();
  const noPermit = String(req.body?.NOPERMIT || req.body?.no_permit || "").trim();

  if (!token && !noPermit) {
   return res.status(400).json({ status: 0, msg: "TOKEN atau NOPERMIT wajib diisi." });
  }

  let deleteSql = "";
  let replacements = {};

  if (token) {
   deleteSql = `
    DELETE FROM [dbo].[contractor_permits]
    WHERE LTRIM(RTRIM(CAST([token] AS VARCHAR(255)))) = :token
   `;
   replacements = { token };
  } else {
   deleteSql = `
    DELETE FROM [dbo].[contractor_permits]
    WHERE LTRIM(RTRIM(CAST([no_permit] AS VARCHAR(255)))) = :noPermit
   `;
   replacements = { noPermit };
  }

  await HRGA.query(deleteSql, { replacements });
  return res.json({ status: 1, msg: "Contractor permit berhasil dihapus." });
 } catch (error) {
  console.error("DeleteContractorPermit error:", error);
  console.error("DeleteContractorPermit detail:", error?.message, error?.original || error?.parent || null);
  return res.status(500).json({ status: 0, msg: "Gagal menghapus contractor permit." });
 }
};
