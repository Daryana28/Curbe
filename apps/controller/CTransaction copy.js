import { DATE, Op, Sequelize } from "sequelize";
import MTrans from "../../cfg/model/MTrans.js";
import moment from "moment";
import { UpdLot } from "./CParkingLot.js";
import { DataCard } from "./CCard.js";

const date = moment().format('YYYY-MM-DD')

export const FindTransByDate = async (req, res) => {
  await MTrans.findAll(
    {
      raw: true, nest: true,
      where: {
        createdAt: {
          [Op.between]: [req.body.start, req.body.end]
        }
      }
    }
  )
    .then((hs) => {
      res.json(hs)
    })
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


export const DataTrans = async (req, res) => {
  if (req.body.STATUS === 'out') {
    const upd = await MTrans.update(
      {
        STATUS: 'out'
      }, {
      where: { TRANSID: req.body.TRANSID }
    }
    )
    if (res === 'ret') {
      return upd[0]
    } else {
      res.json(upd)
    }
  } else {
    //  await MTrans.create({
    //   TRANSID: req.body.TOKEN,
    //   CARDID: req.body.CARDID,
    //   PARKID: req.body.DISPLAY,
    //   NAMA: req.body.NAMA,
    //   TNKB: req.body.TNKB,
    //   JUMLAH: req.body.JUMLAH,
    //   KARYAWAN: req.body.KARYAWAN,
    //   KEPERLUAN: req.body.KEPERLUAN,
    //   PERUSAHAAN: req.body.PERUSAHAAN,
    //   STATUS: req.body.STATUS,
    //   createdAt: moment().format('YYYY-MM-DD HH:MM')
    //  })
    //   .then((hs) => {
    //    data.push(1)
    //   })
    //   .catch((err) => {
    //    data.push(0)
    //   })
    //  return (data[0])
  }
}

export const TransParkingUpd = async (req, res) => {
  await MTrans.update(
    {
      CARDID: req.body.CARDID,
      PARKID: req.body.DISPLAY,
      TNKB: req.body.TNKB,
      JENIS: req.body.JENIS,
    }, {
    where: { TRANSID: req.body.TOKEN }
  }
  ).then((hs) => {
    res.json({ status: 1, msg: 'SUCCESS' })
  })
    .catch((err) => {
      res.json({ status: 0, msg: err })
    })
}
export const RegisterVisitor = async (req, res) => {
  const trans = await DataTrans(req, 'ret')
  const card = await DataCard(req, 'ret')
  const lot = await UpdLot(req, 'ret')
  if (trans > 0 && card > 0 && lot > 0) {
    res.json({ status: 1, msg: 'Success' })
  }
  // console.log(trans+'|'+card+'|'+lot);
  // if (trans > 0) {
  //  if (req.body.CARDID !== null) {
  //   if (card > 0) {
  //    if (req.body.STATUS === 'out') {
  //     if (lot > 0) {
  //      res.json({ status: 1, msg: 'Out Success' })
  //     } else {
  //      res.json({ status: 0, msg: 'Out Failed' })
  //     }
  //    } else {
  //     res.json({ status: 10, msg: 'In Success' })
  //    }
  //   }
  //  } else {
  //   const lot = await UpdLot(req, 'ret')
  //   if (lot > 0 && req.body.STATUS === 'out') {
  //    res.json({ status: 1, msg: 'Outs Success' })
  //   } else if (lot > 0 && req.body.STATUS === 'in') {
  //    res.json({ status: 1, msg: 'In Success' })
  //   } else {
  //    res.json({ status: 0, msg: 'Error' })
  //   }
  //  }
  // } else {
  //  res.json({ status: 0, msg: 'Input Error' })
  // }
}
export const CekTrans = async (req, res) => {
  console.log(req.body);
  const cek = await MTrans.findOne({
    raw: true, nest: true,
    where: {
      TRANSID: req.body.TRANSID
    }
  })
  if (res !== 'ret') {
    res.json(cek)
  } else {
    return (cek)
  }
}
