import moment from "moment";
import MTrans from "../../../cfg/model/MTrans.js";
import vms from "../../../cfg/conn/VMS.js";
import MCard from "../../../cfg/model/MCard.js";
import MParkingLot from "../../../cfg/model/MParkingLot.js";
import MLog from "../../../cfg/model/MLog.js";
import { TriggerParkingSync } from "../CParkingSync.js";

const normalizeStatus = (value) => String(value || "").trim().toLowerCase();

const generateTransId = () =>
 `${moment().format("DDMMYY")}${Math.random().toString(36).substring(2, 7)}`;

const ensureUniqueTransId = async (candidate, transaction) => {
 let nextToken = String(candidate || "").trim() || generateTransId();

 while (await MTrans.findOne({
  where: { TRANSID: nextToken },
  raw: true,
  nest: true,
  transaction,
 })) {
  nextToken = generateTransId();
 }

 return nextToken;
};

const saveErrorCodeLog = async (code, detail = "") => {
 try {
  const now = moment().format("YYYY-MM-DD HH:mm:ss");
  const act = detail ? `${code}|${detail}` : code;
  await MLog.create({
   act,
   createdAt: now,
   updatedAt: now,
  });
 } catch (e) {
  // Keep transaction flow safe even if logging fails.
 }
};

export const TransProcess = async (req, res) => {
 const { btn, dataTamu = {}, kendaraan = {}, fotoIdentitas = null, fotoDiri = null } = req.body;
 const isOut = btn === 'CheckOut';
 const isContractor =
  normalizeStatus(dataTamu.source) === "contractor" ||
  normalizeStatus(dataTamu.type) === "contractor";

 try {
  if (!dataTamu.cardId) {
   await saveErrorCodeLog("CARD_REQUIRED", `btn:${btn || ""}`);
   return res.status(400).json({ message: "CARDID WAJIB DIISI" });
  }

  let token = String(dataTamu.token || "").trim() || generateTransId();
  const jumlahTamu = Math.max(1, parseInt(dataTamu.jumlah, 10) || 1);

  const result = await vms.transaction(async (t) => {
   let transRecord;
   const now = moment().format("YYYY-MM-DD HH:mm:ss");
   let card = null;

   if (isOut) {
    // Logika Check Out: Update data yang sudah ada
    await MTrans.update({
     AKHIR: now,
     STATUS: "out",
     updatedAt: now,
    }, {
     where: { TRANSID: token },
     transaction: t
    });
    transRecord = { TRANSID: token, STATUS: "out" };
   } else {
    card = await MCard.findOne({
     where: { CARDID: dataTamu.cardId },
     raw: true,
     nest: true,
     transaction: t
    });
    if (!card && !isContractor) {
     await saveErrorCodeLog("CARD_NOT_FOUND", `card:${dataTamu.cardId}`);
     throw new Error("Kartu tidak ditemukan.");
    }

    const cardStatus = normalizeStatus(card?.Status);
    const latestByCard = await MTrans.findOne({
     where: { CARDID: dataTamu.cardId },
     order: [["createdAt", "DESC"]],
     raw: true,
     nest: true,
     transaction: t
    });
    const latestTransStatus = normalizeStatus(latestByCard?.STATUS);
    const hasPreviousTrans = Boolean(latestByCard);
    const shouldGenerateNewToken = hasPreviousTrans;
    const isCardStatusAllowedForCheckIn = ["", "ready", "use"].includes(cardStatus);
    const isLatestTransClosed =
     latestTransStatus === "out" || Boolean(String(latestByCard?.AKHIR || "").trim());

    if (!latestByCard && cardStatus && !isCardStatusAllowedForCheckIn) {
     await saveErrorCodeLog("CARD_STATUS_INVALID", `card:${dataTamu.cardId}|status:${cardStatus}`);
     throw new Error("Status kartu tidak valid untuk check-in baru.");
    }

    if (hasPreviousTrans && !isLatestTransClosed) {
     await saveErrorCodeLog(
      "CARD_ACTIVE_TRANSACTION",
      `card:${dataTamu.cardId}|trans:${latestByCard?.TRANSID || ""}|status:${latestTransStatus}`
     );
     throw new Error("Kartu masih dalam status check-in, lakukan check-out terlebih dahulu.");
    }

    if (hasPreviousTrans && !isCardStatusAllowedForCheckIn) {
     await saveErrorCodeLog(
      "CARD_STATUS_AUTO_RECOVER",
      `card:${dataTamu.cardId}|status:${cardStatus}|trans:${latestByCard?.TRANSID || ""}|trans_status:${latestTransStatus}`
     );
    }

   if (shouldGenerateNewToken) {
     token = await ensureUniqueTransId(generateTransId(), t);

     transRecord = await MTrans.create({
      TRANSID: token,
      CARDID: dataTamu.cardId,
      PARKID: kendaraan.parkId ?? null,
      DISPLAY: kendaraan.display ?? null,
      NAMA: dataTamu.nama,
      JENIS: kendaraan.jenis ?? null,
      TNKB: kendaraan.platNomor ?? "",
      JUMLAH: jumlahTamu,
      KARYAWAN: dataTamu.penerima,
      KEPERLUAN: dataTamu.keperluan,
      PERUSAHAAN: dataTamu.perusahaan,
      KTP: fotoIdentitas,
      FOTO: fotoDiri,
      MULAI: now,
      AKHIR: null,
      STATUS: "in",
      createdAt: now,
      updatedAt: null,
     }, { transaction: t });
    } else {
     token = await ensureUniqueTransId(token, t);
     transRecord = await MTrans.create({
      TRANSID: token,
      CARDID: dataTamu.cardId,
      PARKID: kendaraan.parkId ?? null,
      DISPLAY: kendaraan.display ?? null,
      NAMA: dataTamu.nama,
      JENIS: kendaraan.jenis ?? null,
      TNKB: kendaraan.platNomor ?? "",
      JUMLAH: jumlahTamu,
      KARYAWAN: dataTamu.penerima,
      KEPERLUAN: dataTamu.keperluan,
      PERUSAHAAN: dataTamu.perusahaan,
      KTP: fotoIdentitas,
      FOTO: fotoDiri,
      MULAI: now,
      AKHIR: null,
      STATUS: "in",
      createdAt: now,
      updatedAt: null,
     }, { transaction: t });
    }
   }

   const jenisKendaraan = String(kendaraan.jenis || "").toUpperCase();

   // Update status parkir (hanya untuk kendaraan parkir normal)
   if (kendaraan.parkId && !["BERJALAN", "TRUCK"].includes(jenisKendaraan)) {
    await MParkingLot.update(
     {
      CARDID: isOut ? null : dataTamu.cardId,
      JENIS: isOut ? null : kendaraan.jenis ?? null,
      STATUS: isOut ? null : "in",
      TOKEN: isOut ? null : token,
      NIK: isOut ? null : undefined,
      NAMA: isOut ? null : dataTamu.nama ?? null,
      TNKB: isOut ? null : kendaraan.platNomor ?? "",
      MULAI: isOut ? null : now,
      AKHIR: isOut ? null : undefined,
      CREATEDAT: isOut ? null : now,
      UPDATEDAT: isOut ? null : undefined,
     },
     {
      where: { PARKID: Number(kendaraan.parkId), DISPLAY: kendaraan.display },
      transaction: t,
     }
    );
   }

   // Update status Master Kartu
   const shouldUpdateCardMaster = Boolean(dataTamu.cardId) && !isContractor;
   const cardUpdate = shouldUpdateCardMaster
    ? await MCard.update(
       {
        Status: isOut ? null : "use",
        TOKEN: isOut ? null : token
       },
       {
        where: { CARDID: dataTamu.cardId },
        transaction: t
       }
      )
    : [0];

   return { transRecord, cardUpdate };
  });

  if (kendaraan.parkId && !["BERJALAN", "TRUCK"].includes(String(kendaraan.jenis || "").toUpperCase())) {
   await TriggerParkingSync();
  }

  return res.status(200).json({
   message: `Proses ${isOut ? 'Check Out' : 'Check In'} Berhasil`,
   result
  });
 } catch (error) {
  await saveErrorCodeLog("TRANS_PROCESS_ERROR", String(error?.message || "unknown_error"));
  console.error("TransProcess Error:", error);
  return res.status(400).json({ message: error.message || "Terjadi kesalahan server" });
 }
};
