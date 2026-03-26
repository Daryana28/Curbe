import moment from "moment"
import { FindCard, FindCardByToken, UpdateCard } from "./CCard.js"
import { AddTrans, FindTransById, UpdTrans } from "./CTransaction.js"
import { FindParkingById, FindParkingLotByToken, UpdLot, } from "./CParking.js"
import MCard from "../../cfg/model/MCard.js"
import { findParkingByDisp } from "./CPark.js"
import { FindPerm } from "./CPerm.js"

export const CekDisplay = async (req, res) => {
 const data = []
 const LOT = await findParkingByDisp(req.body.Card)
 if (LOT !== null) {
  const PARK = await FindParkingById(LOT.PARKID)
  const Perm = await FindPerm(LOT.DISPLAY)
  if (LOT.TOKEN !== null) {
   const card = await FindCardByToken(LOT.TOKEN)
   const trans = await FindTransById(LOT.TOKEN)
   if (trans !== null) {
    data.push({
     TOKEN: LOT.TOKEN,
     CARD: card[0],
     TRANS: trans,
     PARK: PARK,
     LOT: LOT,
     PERM: Perm,
    })
   }

  } else {
   data.push({
    TOKEN: null,
    CARD: null,
    TRANS: null,
    PARK: PARK,
    LOT: LOT,
    PERM: Perm,
   })
  }
 } else {
  data.push({ status: 0, msg: 'PARKING NUMBER NOT FOUND!!' })
 }
 res.json(data[0])
}

export const RegisterVisitor = async (req, res) => {
 if (req.body.STATUS === 'in') {
  var TOKEN = req.body.TOKEN
  var TRANS = await AddTrans(req.body)
 } else {
  var TOKEN = null
  var TRANS = await UpdTrans(req.body)
 }
 if (TRANS[0] > 0) {
  if (req.body.CARDID !== null) {
   var CARD = await UpdateCard({ TOKEN: TOKEN, CARDID: req.body.CARDID })
   if (CARD[0] > 0) {
    res.json({ status: 1, msg: 'REGISTER VISITOR SUCCESS' })
   } else {
    res.json({ status: 0, msg: 'REGISTER VISITOR FAILED' })
   }
  } else {
   var LOT = await UpdLot(req.body)
   if (LOT[0] > 0) {
    res.json({ status: 10, msg: 'REGISTER KARYAWAN SUCCESS' })
   } else {
    res.json({ status: 0, msg: 'REGISTER KARYAWAN FAILED' })
   }
  }
 }
}
export const CekVisitorCard = async (req, res) => {
 const Card = await FindCard(req.body.Card)
 if (Card[0] !== null) {
  if (Card[0].TOKEN !== null) {
   const LOT = await FindParkingLotByToken(Card[0].TOKEN)
   const TRANS = await FindTransById({ body: { TOKEN: Card[0].TOKEN } })
   if (TRANS !== null) {
    const PARK = await FindParkingById({ body: { PARKID: TRANS.PARKID } })
    res.json({
     TOKEN: Card[0].TOKEN,
     CARD: Card[0],
     PARK,
     LOT,
     TRANS,
     PERM: null,
     PARK: null,
    })
   }
  } else {
   res.json({
    TOKEN: Card[0].TOKEN,
    CARD: Card[0],
    TRANS: null,
    PARK: null,
    LOT: null,
    PERM: null,
    PARK: null,
   })
  }
 } else {
  res.json({
   TOKEN: null,
   Card: null,
   TRANS: null,
   PARK: null,
   LOT: null,
   PERM: null,
   PARK: null,
  })
 }
}
