import { find, where } from "underscore"
import MMasterPark from "../../cfg/model/MMasterPark.js"
import MParkingLot from "../../cfg/model/MParkingLot.js"
import MTrans from "../../cfg/model/MTrans.js"
import moment from "moment"
import { UpdTrans } from "./CTransaction.js"
import { Op } from "sequelize"
import MPerm from "../../cfg/model/MPerm.js"

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

export const CountLot = async (req, res) => {
 if (req.body.STATUS === 'avail') {
  var find = await MParkingLot.findAll({
   raw: true, nest: true,
   where: {
    PARKID: req.body.PARKID,
    CARDID: null
   }
  })
 } else {
  var find = await MParkingLot.findAll({
   raw: true, nest: true,
   where: {
    PARKID: req.body.PARKID,
    CARDID: { [Op.not]: null }
   }
  })
 }
 if (res === 'ret') {
  return find
 }
}
export const FindAllLotById = async (req, res) => {
 console.log(req.body);
 const { PARKID } = req.body
 try {
  var find = await MParkingLot.findAll({
   raw: true, nest: true,
   where: {
    PARKID,
    [Op.or]: [{ STATUS: null }, { STATUS: "" }],
   }
  })
  if (res === "ret") {
   return find
  }
  res.status(200).json(find)

 } catch (error) {
  if (res === "ret") {
   return []
  }
  return res.status(500).json({ message: "Parking lot not found!" })
 }
}
export const FindLotById = async (req, res) => {
 const { PARKID, DISPLAY } = req.body;

 try {
  const find = await MPerm.findOne({
   raw: true,
   nest: true,
   where: { PARKID, DISPLAY },
  });

  if (!find) {
   return res.status(404).json({
    statusTrans: 0,
    msg: "Card Not Found",
    data: "Card Not Found",
   });
  }
  
  const latestTrans = await MTrans.findOne({
   raw: true,
   nest: true,
   where: {
    CARDID: find.CARDID,
   },
   order: [["createdAt", "DESC"]],
  });
  const startDate = find?.MULAI || latestTrans?.MULAI || null;
  const endDate = find?.AKHIR || latestTrans?.AKHIR || startDate;
  const flowStatus = resolveFlowStatus({
   lastStatus: latestTrans?.STATUS,
   startDate,
   endDate,
  });

  const responseData = {
   transId: latestTrans?.TRANSID || find?.TOKEN || null,
   cardId: find?.CARDID || latestTrans?.CARDID || null,
   nama: latestTrans?.NAMA || find?.NAMA || "",
   perusahaan: latestTrans?.PERUSAHAAN || "PERMANEN",
   penerima: latestTrans?.KARYAWAN || "",
   jumlah: Number(latestTrans?.JUMLAH || 1),
   keperluan: latestTrans?.KEPERLUAN || find?.STATUS || "PERMANEN",
   KTP: latestTrans?.KTP || null,
   FOTO: latestTrans?.FOTO || null,
   status: normalizeStatus(latestTrans?.STATUS || ""),
   parkId: latestTrans?.PARKID || find?.PARKID || "",
   display: latestTrans?.DISPLAY || find?.DISPLAY || "",
   jenis: latestTrans?.JENIS || find?.JENIS || "",
   platNomor: latestTrans?.TNKB || find?.TNKB || "",
   createdAt: latestTrans?.createdAt || find?.CREATEDAT || null,
   updatedAt: latestTrans?.updatedAt || find?.UPDATEDAT || null,
   startDate,
   endDate,
   source: "kar",
   token: latestTrans?.TRANSID || find?.TOKEN || null,
  };

  return res.status(200).json({
   status: flowStatus,
   data: responseData,
   source: "kar",
   token: responseData.token,
  });
 } catch (error) {
  console.error("FindLotById Error:", error);
  return res.status(500).json({
   statusTrans: 0,
   msg: error?.message || "Gagal hit API QR",
  });
 }
};



export const UpdLot = async (req, res) => {
 if (req.body.DISPLAY === 'BERJALAN') {
  var upd = [1]
 } else {
  if (req.body.STATUS === 'in') {
   var upd = await MParkingLot.update({
    TOKEN: req.body.TOKEN,
    STATUS: req.body.STATUS,
    JENIS: req.body.JENIS,
    TNKB: req.body.TNKB,
    CREATEDAT: moment().format('YYYY-MM-DD HH:MM:SS'),
    UPDATEDAT: null,
   }, {
    where: {
     PARKID: req.body.PARKID,
     DISPLAY: req.body.DISPLAY,
    }
   })
  } else if (req.body.STATUS === 'out') {
   var upd = await MParkingLot.update({
    TOKEN: null,
    STATUS: null,
    NIK: null,
    CREATEDAT: null,
    UPDATEDAT: moment().format('YYYY-MM-DD HH:MM:SS'),
   }, {
    where: {
     TOKEN: req.body.TOKEN
     // PARKID: req.body.PARKID,
     // DISPLAY: req.body.DISPLAY,
    }
   })
  }
 }
 if (upd[0] > 0) {
  if (res === 'trans') {
   return (upd[0])
  } else {
   res.json({ status: 1, msg: 'SUCCESS' })
  }
 } else if (upd[0] === 0 && req.body.DISPLAY === 'TRUCK') {
  const TR = await UpdTrans(req, 'ret')
  if (TR > 0) {
   if (res === 'trans') {
    return (TR)
   } else {
    res.json({ status: 1, msg: 'SUCCESS' })
   }
  } else {
   res.json({ status: 0, msg: 'FAILED' })
  }
 }
}
export const CekDisplay = async (req, res) => {
 const cek = await MParkingLot.findOne({
  raw: true, nest: true,
  where: {
   DISPLAY: req.body.DISPLAY
  }
 })

 if (res !== 'ret') {
  res.json(cek)
 }
}
