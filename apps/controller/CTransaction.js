import { DATE, Op, Sequelize } from "sequelize";
import MTrans from "../../cfg/model/MTrans.js";
import moment from "moment";
import { UpdLot } from "./CParkingLot.js";
import { DataCard } from "./CCard.js";
import MParkingLot from "../../cfg/model/MParkingLot.js";
import MCard from "../../cfg/model/MCard.js";
import vms from "../../cfg/conn/VMS.js";
import { TriggerParkingSync } from "./CParkingSync.js";

const date = moment().format('YYYY-MM-DD')

export const CountTrans = async (req, res) => {
 if (req.body !== undefined) {
  if (req.body.CAT <= 200) {
   var total = await MTrans.findAll({
    raw: true, nest: true,
    where: {
     [Op.and]: Sequelize.fn(`CAST(createdAt as DATE) =`, moment().format('YYYY-MM-DD')),
     CARDID: { [Op.like]: req.body.CAT + '%' }
    }
   })
   var masuk = await MTrans.findAll({
    raw: true, nest: true,
    where: {
     [Op.and]: Sequelize.fn(`CAST(createdAt as DATE) =`, moment().format('YYYY-MM-DD')),
     CARDID: { [Op.like]: req.body.CAT + '%' },
     STATUS: 'in'
    }
   })
   var out = await MTrans.findAll({
    raw: true, nest: true,
    where: {
     [Op.and]: Sequelize.fn(`CAST(createdAt as DATE) =`, moment().format('YYYY-MM-DD')),
     CARDID: { [Op.like]: req.body.CAT + '%' },
     STATUS: 'out'
    }
   })
  } else {
   var total = await MTrans.findAll({
    raw: true, nest: true,
    where: {
     [Op.and]: Sequelize.fn(`CAST(createdAt as DATE) =`, moment().format('YYYY-MM-DD')),
     PERUSAHAAN: 'PT.Indonesia Koito',
    }
   })
   var masuk = await MTrans.findAll({
    raw: true, nest: true,
    where: {
     [Op.and]: Sequelize.fn(`CAST(createdAt as DATE) =`, moment().format('YYYY-MM-DD')),
     PERUSAHAAN: 'PT.Indonesia Koito',
     STATUS: 'in'
    }
   })
   var out = await MTrans.findAll({
    raw: true, nest: true,
    where: {
     [Op.and]: Sequelize.fn(`CAST(createdAt as DATE) =`, moment().format('YYYY-MM-DD')),
     PERUSAHAAN: 'PT.Indonesia Koito',
     STATUS: 'out'
    }
   })
  }
 }
 res.json({
  total: total.length,
  in: masuk.length,
  out: out.length,
 });
}
export const Identitas = async (req, res) => {
 await MTrans.update({ KTP: req.body.KTP }, { where: { TRANSID: req.body.TRANSID } })
  .then((hs) => {
   res.json({ status: 1 })
  })
  .catch((err) => {
   res.json({ status: 0, msg: err })
  })
}

export const Foto = async (req, res) => {
 await MTrans.update({ FOTO: req.body.FOTO }, { where: { TRANSID: req.body.TRANSID } })
  .then((hs) => {
   res.json({ status: 1, msg: 'Register Successed!!' })
  })
  .catch((err) => {
   res.json({ status: 0, msg: err })
  })
}

export const UpdTrans = async (req, res) => {
 const upd = await MTrans.update(
  {
   PARKID: req.body.PARKID,
   DISPLAY: req.body.DISPLAY,
   TNKB: req.body.TNKB,
   JENIS: req.body.JENIS,
  }, {
  where: { TRANSID: req.body.TOKEN }
 }
 )
 if (res === 'ret') {
  if (upd[0] > 0) {
   return (upd[0])
  }
 }
}
export const RegisterVisitor = async (req, res) => {
 const Crd = await DataCard(req, 'ret')
 const Trans = await TransIn(req, 'ret')
}

export const TransOut = async (req, res) => {
 try {
  const { CARDID, JENIS, DISPLAY, PARKID, TRANSID, checkoutNote } = req.body;
  const now = moment().format("YYYY-MM-DD HH:mm:ss");

  if (!CARDID || !TRANSID) {
   return res.status(400).json({ success: false, message: "Data tidak lengkap" });
  }

  // Update kartu
  const saveCard = await MCard.update(
   { Status: null, TOKEN: null },
   { where: { CARDID } }
  );

  if (JENIS !== 'BERJALAN' && JENIS !== 'TRUCK') {
   // Kosongkan lot parkir
   const lot = await MParkingLot.update(
    {
     CARDID: null,
     JENIS: null,
     STATUS: null,
     TOKEN: null,
     NIK: null,
     NAMA: null,
     TNKB: null,
     MULAI: null,
     AKHIR: null,
     CREATEDAT: null,
     UPDATEDAT: null,
    },
    { where: { DISPLAY, PARKID } }
   );
  }

  // Update transaksi
  const saveTrans = await MTrans.update(
   {
    AKHIR: now,
    STATUS: "out",
    NOTE: checkoutNote || null, // simpan catatan checkout
    updatedAt: now,
   },
   { where: { TRANSID } }
  );

  if (JENIS !== 'BERJALAN' && JENIS !== 'TRUCK') {
   await TriggerParkingSync();
  }

  return res.status(200).json({ success: true, message: "Check Out berhasil" });
 } catch (error) {
  console.error("TransOut error:", error);
  return res.status(500).json({ success: false, message: "Server error", error });
 }
};

export const TransKarIn = async (req, res) => {
 const { dataTamu = {}, kendaraan = {}, fotoDiri = null } = req.body;

 try {
  const now = moment().format("YYYY-MM-DD HH:mm:ss");
  let token = dataTamu.token ?? (Math.random().toString(36).substring(0, 3) + Math.random().toString(7).substring(0, 4));
  const dataTrans = {
   TRANSID: token,
   CARDID: dataTamu.cardId,
   PARKID: kendaraan.parkId,
   DISPLAY: kendaraan.display,
   NAMA: dataTamu.nama,
   JENIS: kendaraan.jenis,
   TNKB: kendaraan.platNomor,
   JUMLAH: 1,
   PERUSAHAAN: "PIK",
   MULAI: now,
   STATUS: dataTamu.statusTrans,
   createdAt: now,
   updatedAt: null,
  };

  const result = await vms.transaction(async (t) => {
   // Create transaksi
   const trans = await MTrans.create(dataTrans, { transaction: t });
   const parkirUpdate = await MParkingLot.update(
    {
     CARDID: dataTamu.cardId,
     JENIS: kendaraan.jenis,
     STATUS: dataTamu.statusTrans,
     TOKEN: token,
     NAMA: dataTamu.nama,
     TNKB: kendaraan.platNomor ?? "",
     MULAI: moment().format("YYYY-MM-DD HH:mm:ss"),
    },
    {
     where: { PARKID: kendaraan.parkId, DISPLAY: kendaraan.display },
     transaction: t,
    }
   );

   // Update status kartu
   const cardUpdate = await MCard.update(
    { Status: "use", TOKEN: token },
    { where: { CARDID: dataTamu.cardId }, transaction: t }
   );
   return { trans, parkirUpdate, cardUpdate };

  })
  if (kendaraan.parkId && !['BERJALAN', 'TRUCK'].includes(String(kendaraan.jenis || '').toUpperCase())) {
   await TriggerParkingSync();
  }
  return res.status(200).json({ message: "Transaksi berhasil", result });


 } catch (error) {
  console.log(error);
  return res.status(400).json({ message: "Terjadi kesalahan server", error });

 }
}




export const FindTransByDate = async (req, res) => {
 await MTrans.findAll(
  {
   raw: true, nest: true,
   where: {
    [Op.and]: Sequelize.fn(`CAST(createdAt as DATE) =`, `${req.body.start}`),
    // createdAt: {
    //  [Op.between]: [req.body.start, req.body.end]
    // }
   },
   order: [['createdAt', 'desc']]
  }
 )
  .then((hs) => {
   res.json(hs)
  })
}

export const DeleteTrans = async (req, res) => {
 const { TRANSID } = req.body;

 if (!TRANSID) {
  return res.status(400).json({ message: "TRANSID wajib diisi" });
 }

 try {
  const transaksi = await MTrans.findOne({
   where: { TRANSID },
   raw: true,
   nest: true,
  });

  if (!transaksi) {
   return res.status(404).json({ message: "Transaksi tidak ditemukan" });
  }

  await vms.transaction(async (t) => {
   await MTrans.destroy({
    where: { TRANSID },
    transaction: t,
   });

   if (transaksi.PARKID && transaksi.DISPLAY) {
    await MParkingLot.update(
     {
      CARDID: null,
      JENIS: null,
      STATUS: null,
      TOKEN: null,
      NIK: null,
      NAMA: null,
      TNKB: null,
      MULAI: null,
      AKHIR: null,
      CREATEDAT: null,
      UPDATEDAT: null,
     },
     {
      where: {
       PARKID: transaksi.PARKID,
       DISPLAY: transaksi.DISPLAY,
       TOKEN: transaksi.TRANSID,
      },
      transaction: t,
     }
    );
   }

   if (transaksi.CARDID) {
    await MCard.update(
     {
      Status: null,
      TOKEN: null,
     },
     {
      where: {
       CARDID: transaksi.CARDID,
       TOKEN: transaksi.TRANSID,
      },
      transaction: t,
     }
    );
   }
  });

  if (transaksi.PARKID && transaksi.DISPLAY) {
   await TriggerParkingSync();
  }

  return res.status(200).json({ message: "Transaksi berhasil dihapus" });
 } catch (error) {
  console.error("DeleteTrans error:", error);
  return res.status(500).json({ message: "Gagal menghapus transaksi", error: error.message });
 }
}

