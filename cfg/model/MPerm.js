import { Sequelize } from "sequelize";
import vms from "../conn/VMS.js";

const { DataTypes } = Sequelize

const MPerm = vms.define('MASTERPERM', {
 PERMID: {
  type: DataTypes.STRING,
  primaryKey: true,
 },
 PARKID: {
  type: DataTypes.STRING
 },
 DISPLAY: {
  type: DataTypes.STRING
 },
 NIK: {
  type: DataTypes.STRING
 },
 NAMA: {
  type: DataTypes.STRING
 },
 CARDID: {
  type: DataTypes.STRING
 },
 TNKB: {
  type: DataTypes.STRING
 },
 STATUS: {
  type: DataTypes.STRING
 },
 MULAI: {
  type: DataTypes.STRING
 },
 AKHIR: {
  type: DataTypes.STRING
 },
}, {
 freezeTableName: true,
 timestamps: false
});

export default MPerm