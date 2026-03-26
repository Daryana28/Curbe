import express from 'express'
import { FindUser, ListKaryawan, Login, Logout, refreshToken } from '../controller/CLogin.js'
import { CekLogin } from '../middleware/CekLogin.js'
import { CekDisplay, FindAllLotById, UpdLot } from '../controller/CParkingLot.js'
import { CountTrans, DeleteTrans, FindTransByDate, Foto, Identitas, RegisterVisitor, TransKarIn, TransOut } from '../controller/CTransaction.js'
import { FindPermByDisplay, ListPerm } from '../controller/CPerm.js'
import { ListVehicle } from '../controller/CVehicle.js'
import { GetVisitorList } from '../controller/CVisitor.js'
import { CountParking, FindMasterParkByJenis, ParkingMonitor } from '../controller/CPark.js'
import { FindContractorPermitByMonth, FindPermitByMonth, ManagePermit } from '../controller/CPERMIT.js'
import { AddPengguna, DelPengguna, ListPengguna } from '../controller/CPengguna.js'
import { CekQR } from '../controller/Register/CekQR.js'
import { CekCard } from '../controller/Register/CekCard.js'
import { FindLotById } from '../controller/Register/FindLotById.js'
import { CekTrans } from '../controller/Transaksi/CekTransaksi.js'
import { TransProcess } from '../controller/Transaksi/TransIn.js'
import {
 BroadcastNotification,
 GetWebPushPublicKey,
 SubscribeWebPush,
 UnsubscribeWebPush
} from '../controller/CRealtime.js'

const router = express.Router()

router.post('/Login', Login)
router.post('/refreshToken', refreshToken)
router.post('/Logout',CekLogin, Logout)
router.post('/FindUser',CekLogin, FindUser)
router.post('/ListKaryawan',CekLogin, ListKaryawan)
router.post('/AddPengguna',CekLogin, AddPengguna)
router.post('/DelPengguna',CekLogin, DelPengguna)

router.post('/ListPengguna',CekLogin, ListPengguna)

router.post('/CekCard', CekLogin, CekCard)
router.post('/CekQR', CekLogin, CekQR)
router.post('/RegisterVisitor', CekLogin, TransProcess)

router.post('/CekDisplay', CekLogin, CekDisplay)

router.post('/CekTrans', CekLogin, CekTrans)
router.post('/FindTransByDate', CekLogin, FindTransByDate)
router.post('/DeleteTrans', CekLogin, DeleteTrans)
router.post('/TransProcess', CekLogin, TransProcess)
router.post('/TransOut', CekLogin, TransOut)
router.post('/TransKarIn', CekLogin, TransKarIn)
router.post('/Identitas', CekLogin, Identitas)
router.post('/Foto', CekLogin, Foto)
router.post('/CountTrans', CekLogin, CountTrans)

router.post('/FindPermitByMonth', CekLogin, FindPermitByMonth)
router.post('/FindContractorPermitByMonth', CekLogin, FindContractorPermitByMonth)
router.post('/ManagePermit', CekLogin, ManagePermit)

router.post('/FindPermByDisplay', FindPermByDisplay)
router.post('/ListPerm', ListPerm)

router.post('/ListVehicle', CekLogin, ListVehicle)
router.post('/GetVisitorList', CekLogin, GetVisitorList)

router.post('/FindAllLotById', CekLogin, FindAllLotById)
router.post('/FindLotById', CekLogin, FindLotById)
router.post('/UpdLot', CekLogin, UpdLot)

router.post('/FindMasterParkByJenis', CekLogin, FindMasterParkByJenis)
router.post('/ParkingMonitor', CekLogin, ParkingMonitor)
router.post('/CountParking', CekLogin, CountParking)

router.get('/WebPush/PublicKey', CekLogin, GetWebPushPublicKey)
router.post('/WebPush/Subscribe', CekLogin, SubscribeWebPush)
router.post('/WebPush/Unsubscribe', CekLogin, UnsubscribeWebPush)
router.post('/Notify/Broadcast', CekLogin, BroadcastNotification)
export default router
