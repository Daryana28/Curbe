import { Sequelize } from "sequelize";
import MMasterPark from "../../cfg/model/MMasterPark.js";
import MParkingLot from "../../cfg/model/MParkingLot.js";
import { CountLot, FindAllLotById, FindLotById } from "./CParkingLot.js";
import { FindPermByDisplay } from "./CPerm.js";
import { CountTrans } from "./CTransaction.js";
import { CekTrans } from "./Transaksi/CekTransaksi.js";


export const CountParking = async (req, res) => {
 const data = []
 const park = await MasterPark(null, 'ret')
 for (let row = 0; row < park.length; row++) {
  // data.push({ PARKNAME: park[row].NAME })
  const use = await CountLot({ body: { PARKID: park[row].PARKID, STATUS: 'use' } }, 'ret')
  const avail = await CountLot({ body: { PARKID: park[row].PARKID, STATUS: 'avail' } }, 'ret')
  data.push({ PARKNAME: park[row].NAME, USE: use.length, AVAIL: avail.length })
 }
 if (res !== 'ret') {
  res.json(data)
 }
}
export const MasterPark = async (req, res) => {
 const find = await MMasterPark.findAll({ raw: true, nest: true })
 if (res === 'ret') {
  return find
 }
}
export const ParkingMonitor = async (req, res) => {
 const data = []
 const park = await MasterPark('', 'ret')
 for (let row = 0; row < park.length; row++) {
  var lt = []
  const lot = await MParkingLot.findAll({
   raw: true,
   nest: true,
   where: { PARKID: park[row].PARKID },
   order: [["DISPLAY", "ASC"]],
  })
  for (let row2 = 0; row2 < lot.length; row2++) {
   const perm = await FindPermByDisplay({ body: { DISPLAY: lot[row2].DISPLAY } }, 'ret')
   const trans = await CekTrans({ body: { ret: 'ret', TRANSID: lot[row2].TOKEN } }, 'ret')
   lt.push([lot[row2], perm, trans])
  }
  data.push([park[row].JENIS, park[row].NAME, park[row].ROW, park[row].COL, lt])
 }
 res.json(data)
}

export const findParkingByDisp = async (req, res) => {
 if (req.body !== undefined) {
  const find = await MParkingLot.findOne({ raw: true, nest: true, where: { DISPLAY: req.body.Card } })
  res.json(find)
 } else {
  const find = await MParkingLot.findOne({ raw: true, nest: true, where: { DISPLAY: req } })
  return find
 }
}

export const FindMasterParkByJenis = async (req, res) => {
  try {
    const { Vehicle } = req.body;

    // Validasi input
    if (!Vehicle || typeof Vehicle !== "string") {
      return res.status(400).json({
        status: "error",
        message: "Parameter 'Vehicle' wajib diisi dan harus berupa string.",
      });
    }

    // Query ke database
    const parks = await MMasterPark.findAll({
      where: { JENIS: Vehicle },
    });

    // Jika tidak ditemukan
    if (!parks || parks.length === 0) {
      return res.status(404).json({
        status: "not_found",
        message: `Data parkir dengan jenis '${Vehicle}' tidak ditemukan.`,
      });
    }

    // Response sukses
    return res.json(parks);

  } catch (error) {
    console.error("Error FindMasterParkByJenis:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server.",
      error: error.message,
    });
  }
};

