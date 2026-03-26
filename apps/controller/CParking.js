import { Op } from "sequelize"
import MMasterVehicle from "../../cfg/model/MMasterVehicle.js"
// import { FindMasterPark } from "./CPark.js"
import MMasterPark from "../../cfg/model/MMasterPark.js"
import MParkingLot from "../../cfg/model/MParkingLot.js"
import { FindTrans } from "./CTransaction.js"
import moment from "moment"
import { FindCard } from "./CCard.js"
import { FindPerm } from "./CPerm.js"
import { FindMasterParkById } from "./CPark.js"

export const FindByParking = async (req, res) => {
 const Parking = await FindParking(req.body.DISPLAY)
 if (Parking !== null) {
  if (Parking.CARDID !== null) {
   const Card = await FindCard(Parking.CARDID)
   res.json(Card)
  } else {
   const Perm = await FindPerm(Parking.DISPLAY)
   res.json(Perm)
   // const Card = await FindCard(Parking.CARDID)
   // res.json(Card)
  }
 }
}
export const FindParking = async (req, res) => {
 if (req.body === undefined) {
  const find = await MParkingLot.findOne(
   {
    raw: true, nest: true,
    where: {
     DISPLAY: req
    }
   }
  )
  return find
  
 } else {
  await MParkingLot.findOne(
   {
    raw: true, nest: true,
    where: {
     DISPLAY: req.body.DISPLAY
    }
   }
  )
  .then((hs)=>{
   res.json(hs)
  })
 }

}
export const UpdParkingLot = async (req, res) => {
 const updLot = async () => {
  if (req.body === undefined) {
   const LOT = await MParkingLot.update(
    {
     CARDID: null,
     STATUS: 'ready',
     TOKEN: null,
     TNKB: null,
     MULAI: null,
     AKHIR: null,
    },
    { where: { TOKEN: req.TRANSID } }
   )
   return LOT
  } else {
   const Trans = await FindTrans(req.body.TOKEN)
   if (Trans !== null) {
    await MParkingLot.update(
     {
      CARDID: Trans.CARDID,
      STATUS: req.body.STATUS,
      TOKEN: req.body.TOKEN,
      TNKB: req.body.TNKB,
      NAMA: Trans.NAMA,
      MULAI: moment().format('YYYY-MM-DD')
     },
     {
      where: { ID: req.body.LOT }
     }
    )
     .then((hs) => {
      res.json({ status: 1, msg: 'Sucess' })
     })
     .catch((err) => {
      res.json({ status: 0, msg: err })
     })
   }
  }
 }
 updLot()
}
export const ListParkingLot = async (data) => {
 const list = await MParkingLot.findAll(
  {
   raw: true, nest: true,
   where: {
    PARKID: data
   }
  }
 )

 return list
}
export const ListParking = async (req, res) => {
 const data = []
 await MMasterPark.findAll(
  {
   raw: true, nest: true,
   where: {
    JENIS: req.body.Vehicle
   }
  }
 )
  .then(async (hs) => {
   for (let row = 0; row < hs.length; row++) {
    const lot = await ListParkingLot(hs[row].PARKID)
    data.push(
     {
      PARKID: hs[row].PARKID,
      NAME: hs[row].NAME,
      JENIS: hs[row].JENIS,
      ROW: hs[row].ROW,
      COL: hs[row].COL,
      LOT: lot
     }
    );
   }
   res.json(data)
  })
  .catch((err) => {
   res.json({ status: 0, msg: err })
  })
}
export const CountParking = async (req, res) => {
 const data = []
 await MMasterVehicle.findAll({
  raw: true, nest: true,
  where: {
   Vehicle: { [Op.not]: ['TRUCK', 'PEDESTRIAN'] }
  }
 })
  .then(async (hs) => {
   for (let row = 0; row < hs.length; row++) {
    console.log(hs[row]);
    // const Park = await FindMasterPark(hs[row].Vehicle)
    data.push(
     {
      Id: hs[row].Id,
      Vehicle: hs[row].Vehicle,
      Icon: hs[row].Icon,
      Park: Park
     }
    );
   }
   res.json(data)
  })
}