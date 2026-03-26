import { Op } from "sequelize"
import MCard from "../../cfg/model/MCard.js"
import moment from "moment"
import axios from "axios";
import https from "https";
import { CekTrans } from "./Transaksi/CekTransaksi.js";

export const DataCard = async (req, res) => {
 if (req.body.STATUS === 'out') {
  var TOKEN = null
  var STATUS = null
 } else if (req.body.STATUS === 'in') {
  var TOKEN = req.body.TOKEN
  var STATUS = 'use'
 }

 const hs = await MCard.update(
  {
   Status: STATUS,
   TOKEN: TOKEN,
   UpdateAt: moment().format('YYYY-MM-DD HH:MM')
  }, {
  where: { CARDID: req.body.CARDID }
 }
 )

 return (hs[0])
}

export const CekCard = async (req, res) => {
 try {
  const find = await MCard.findOne({
   raw: true,
   nest: true,
   where: {
    CARDID: req.body.CARDID,
   },
  });

  if (!find) {
   return res.status(404).json({
    status: 0,
    msg: "Card not found",
   });
  }
  const cekTransaksi = await CekTrans({ body: { ret: 'ret', TRANSID: find.TOKEN } });
  
  // Format respons sesuai contoh
  const responseData = {
   cardId: req.body.CARDID || null,
   cekTransaksi: cekTransaksi || null,
   images: find.images || [], // sesuaikan dengan kolom di DB jika ada
   kewarganegaraan: find.kewarganegaraan || "",
   nama: find.nama || "",
   no_paspor: find.no_paspor || "",
   requestVisitor: find.requestVisitor || null,
   tempat_tinggal: find.tempat_tinggal || "",
   token: find.token || "",
   tokenAttn: cekTransaksi?.TRANSID || "", // kalau ada transaksi pakai TRANSID
   status: cekTransaksi !== null ? "Out" : "In", // status berdasarkan ada tidaknya transaksi
  };

  return res.status(200).json({
   status: cekTransaksi ? "Out" : "In",
   data: responseData,
  });

 } catch (error) {
  console.error("CekQR Error:", error?.response?.data || error.message);
  return res.status(500).json({
   status: 0,
   msg: error?.response?.data || "Gagal hit API QR",
  });
 }
};




