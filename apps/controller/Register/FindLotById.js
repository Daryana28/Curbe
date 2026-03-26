import moment from "moment";
import db from "../../../cfg/model/index.js";
import MPerm from "../../../cfg/model/MPerm.js";
import { Op } from "sequelize";

export const FindLotById = async (req, res) => {
 const { PARKID, DISPLAY } = req.body;
 try {
  const start = moment().startOf("day").format("YYYY-MM-DD HH:mm:ss.SSS");
  const end = moment().endOf("day").format("YYYY-MM-DD HH:mm:ss.SSS");

  const find = await MPerm.findOne({
   raw: true,
   nest: true,
   where: { PARKID, DISPLAY },
   include: [
    {
     model: db.MCard,
     as: "cardPermanent",
     include: [
      {
       model: db.MTrans,
       as: "transactionCard",
       required: false,
       where: {
        createdAt: {
         [Op.between]: [start, end],
        },
       },
      },
     ],
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

  // Ambil transaksi terakhir jika ada
  const lastTrans = find.cardPermanent?.transactionCard
   ? Array.isArray(find.cardPermanent.transactionCard)
    ? find.cardPermanent.transactionCard[0]
    : find.cardPermanent.transactionCard
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
   CARDID: find.cardPermanent?.CARDID || null,
   Serial_Number: find.cardPermanent?.Serial_Number || null,
   Card_Code: find.cardPermanent?.Card_Code || null,
   Card_Desc: find.cardPermanent?.Card_Desc || null,
   Status: find.cardPermanent?.Status || null,
   TOKEN: find.cardPermanent?.TOKEN || null,
   transactionCardToken: {
     TRANSID: lastTrans.TRANSID || null,
     CARDID: lastTrans.CARDID || find.CARDID || null,
     PARKID: lastTrans.PARKID || find.PARKID || null,
     DISPLAY: lastTrans.DISPLAY || find?.DISPLAY || null,
     NAMA: find.NAMA || null,
     TNKB: lastTrans.TNKB || null,
     JENIS: lastTrans.JENIS || null,
     JUMLAH: lastTrans.JUMLAH || null,
     KARYAWAN: lastTrans.KARYAWAN || null,
     KEPERLUAN: lastTrans.KEPERLUAN || null,
     AKTIFITAS: lastTrans.AKTIFITAS || null,
     PERUSAHAAN: lastTrans.PERUSAHAAN || null,
     KTP: lastTrans.KTP || null,
     FOTO: lastTrans.FOTO || null,
     MULAI: lastTrans.MULAI || null,
     AKHIR: lastTrans.AKHIR || null,
     STATUS: lastTrans.STATUS || "in",
     createdAt: lastTrans.createdAt || null,
     updatedAt: lastTrans.updatedAt || null,
    }
  };

  res.json({
   status: nextStatus,
   data,
   token: find.cardPermanent?.TOKEN || null,
  });
 } catch (error) {
  console.error(error);
  res.status(500).json({ error: error.message });
 }
};
