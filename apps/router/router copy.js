import express from 'express'
import { FindUser, ListKaryawan, Login, Logout, refreshToken } from '../controller/CLogin.js'
import { CekLogin } from '../middleware/CekLogin.js'
import { CekCard } from '../controller/CCard.js'
import { CekDisplay, FindLotById, UpdLot } from '../controller/CParkingLot.js'
import { CekTrans, FindTransByDate, Foto, Identitas, RegisterVisitor, TransParkingUpd } from '../controller/CTransaction.js'
import { FindPermByDisplay } from '../controller/CPerm.js'
import { ListVehicle } from '../controller/CVehicle.js'
import { FindMasterParkByJenis, ParkingMonitor } from '../controller/CPark.js'
import { AddPermit, FindPermitByMonth } from '../controller/CPERMIT.js'
import { AddPengguna, DelPengguna, ListPengguna } from '../controller/CPengguna.js'

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

router.post('/CekDisplay', CekLogin, CekDisplay)

router.post('/CekTrans', CekLogin, CekTrans)
router.post('/RegisterVisitor', CekLogin, RegisterVisitor)
router.post('/TransParkingUpd', CekLogin, TransParkingUpd)
router.post('/Identitas', CekLogin, Identitas)
router.post('/Foto', CekLogin, Foto)
router.post('/FindTransByDate', CekLogin, FindTransByDate)

router.post('/FindPermitByMonth', CekLogin, FindPermitByMonth)
router.post('/AddPermit', CekLogin, AddPermit)

router.post('/FindPermByDisplay', FindPermByDisplay)

router.post('/ListVehicle', CekLogin, ListVehicle)

router.post('/FindLotById', CekLogin, FindLotById)
router.post('/UpdLot', CekLogin, UpdLot)

router.post('/FindMasterParkByJenis', CekLogin, FindMasterParkByJenis)
router.post('/ParkingMonitor', CekLogin, ParkingMonitor)
export default router