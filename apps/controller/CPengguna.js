import { has, where } from "underscore";
import MPengguna from "../../cfg/model/MAccess.js"
import bcrypt from 'bcrypt';
import moment from "moment";

export const DelPengguna = async (req, res) => {
 await MPengguna.destroy({ where: { NIK: req.body.NIK } })
  .then((hs) => {
   res.json({ status: 1, msg: 'SUCCESS' })
  })
  .catch((err) => {
   res.json({ status: 0, msg: err })
  })
}
export const AddPengguna = async (req, res) => {
 const cek = await FindPengguna(req, 'ret')
 if (cek === null) {
  const hash = await bcrypt.hash(req.body.PASS, 10)
  await MPengguna.create({
   NIK: req.body.NIK,
   NAMA: req.body.NAMA,
   DEPT: req.body.DEPT,
   PASSWORD: hash,
   LEV: req.body.LEV,
   createdAt: moment().format('YYYY-MM-DD HH:MM')
  })
   .then((hs) => {
    res.json({ status: 1, msg: 'SUCCESS' })
   })
   .catch((err) => {
    res.json({ status: 0, msg: err })
   })
 } else {
  if (req.body.PASS === undefined) {
   var pass = cek.PASSWORD
  } else {
   var pass = await bcrypt.hash(req.body.PASS, 10)
  }
  await MPengguna.update({
   NIK: req.body.NIK,
   NAMA: req.body.NAMA,
   DEPT: req.body.DEPT,
   PASSWORD: pass,
   LEV: req.body.LEV,
   updatedAt: moment().format('YYYY-MM-DD HH:MM')
  }, {
   where: { NIK: req.body.NIK }
  })
   .then((hs) => {
    console.log(hs);
    res.json({ status: 1, msg: 'SUCCESS' })
   })
   .catch((err) => {
    res.json({ status: 0, msg: err })
   })
 }
}

export const FindPengguna = async (req, res) => {
 const find = await MPengguna.findOne({
  raw: true, nest: true,
  where: {
   NIK: req.body.NIK
  }
 })
 if (res === 'ret') {
  return (find)
 }
}
export const ListPengguna = async (req, res) => {
 const data = []
 await MPengguna.findAll(
  {
   raw: true, nest: true
  }
 )
  .then((hs) => {
   for (let row = 0; row < hs.length; row++) {
    data.push(
     {
      NIK: hs[row].NIK,
      NAMA: hs[row].NAMA,
      DEPT: hs[row].DEPT,
      LEV: hs[row].LEV,
      TOKEN: hs[row].TOKEN,
      createdAt: hs[row].createdAt,
      updatedAt: hs[row].updatedAt
     }
    )
   }
   res.json(data)
  })
}