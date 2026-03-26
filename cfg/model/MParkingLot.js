
import { Sequelize } from "sequelize";
import vms from "../conn/VMS.js";

const { DataTypes } = Sequelize

const MParkingLot = vms.define('PARKINGLOT', {
 ID: {
  type: DataTypes.STRING,
  primaryKey: true,
  autoIncrement: true
 },
 DISPLAY: {
  type: DataTypes.STRING
 },
 PARKID: {
  type: DataTypes.STRING
 },
 CARDID: {
  type: DataTypes.STRING
 },
 JENIS: {
  type: DataTypes.STRING
 },
 STATUS: {
  type: DataTypes.STRING
 },
 TOKEN: {
  type: DataTypes.STRING
 },
 NIK: {
  type: DataTypes.STRING
 },
 NAMA: {
  type: DataTypes.STRING
 },
 TNKB: {
  type: DataTypes.STRING
 },
 MULAI: {
  type: DataTypes.STRING
 },
 AKHIR: {
  type: DataTypes.STRING
 },
 CREATEDAT: {
  type: DataTypes.STRING
 },
 UPDATEDAT: {
  type: DataTypes.STRING
 },
}, {
 freezeTableName: true,
 timestamps: false
});

export default MParkingLot
