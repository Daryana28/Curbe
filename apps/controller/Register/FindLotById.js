import db from "../../../cfg/model/index.js";
import MPerm from "../../../cfg/model/MPerm.js";
import MTrans from "../../../cfg/model/MTrans.js";

export const FindLotById = async (req, res) => {
 const { PARKID, DISPLAY } = req.body;
 try {
  const find = await MPerm.findOne({
   raw: true,
   nest: true,
   where: { PARKID, DISPLAY },
   include: [
    {
     model: db.MCard,
     as: "cardPermanent",
    },
    {
     model: db.MMasterPark,
     as: "masterPark", // ✅ ini akan jalan setelah relasi benar
    }
   ],
  });

  if (!find) {
   return res.status(404).json({ message: "Lot tidak ditemukan" });
  }

  const cardId = find.cardPermanent?.CARDID || find.CARDID || null;
  const lastTrans = cardId
   ? await MTrans.findOne({
      raw: true,
      nest: true,
      where: { CARDID: cardId },
      order: [["createdAt", "DESC"]],
     })
   : null;

  let nextStatus = "In"; // default
  if (lastTrans) {
   if (lastTrans.STATUS?.toLowerCase() === "in") {
    nextStatus = "Out";
   } else if (lastTrans.STATUS?.toLowerCase() === "out") {
    nextStatus = "In";
   }
  }

  // Mapping data sesuai format baru
  const data = {
   CARDID: cardId,
   Serial_Number: find.cardPermanent?.Serial_Number || null,
   Card_Code: find.cardPermanent?.Card_Code || null,
   Card_Desc: find.cardPermanent?.Card_Desc || null,
   Status: find.cardPermanent?.Status || null,
   TOKEN: find.cardPermanent?.TOKEN || null,
   transactionCardToken: {
     TRANSID: lastTrans?.TRANSID || null,
     CARDID: lastTrans?.CARDID || cardId,
     PARKID: lastTrans?.PARKID || find.PARKID || null,
     DISPLAY: lastTrans?.DISPLAY || find?.DISPLAY || null,
     NAMA: find.NAMA || null,
     TNKB: lastTrans?.TNKB || null,
     JENIS: lastTrans?.JENIS || null,
     JUMLAH: lastTrans?.JUMLAH || null,
     KARYAWAN: lastTrans?.KARYAWAN || null,
     KEPERLUAN: lastTrans?.KEPERLUAN || null,
     AKTIFITAS: lastTrans?.AKTIFITAS || null,
     PERUSAHAAN: lastTrans?.PERUSAHAAN || null,
     KTP: lastTrans?.KTP || null,
     FOTO: lastTrans?.FOTO || null,
     MULAI: lastTrans?.MULAI || null,
     AKHIR: lastTrans?.AKHIR || null,
     STATUS: lastTrans?.STATUS || "in",
     createdAt: lastTrans?.createdAt || null,
     updatedAt: lastTrans?.updatedAt || null,
    }
  };

  res.json({
   status: nextStatus,
   data,
   token: lastTrans?.TRANSID || find.cardPermanent?.TOKEN || null,
  });
 } catch (error) {
  console.error(error);
  res.status(500).json({ error: error.message });
 }
};
