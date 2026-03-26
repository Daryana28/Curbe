import { Sequelize } from "sequelize";
import vms from "../conn/VMS.js";

const { DataTypes } = Sequelize

const MPermit = vms.define('WORKINGPERMIT', {
 TOKEN: {
  type: DataTypes.STRING,
  primaryKey: true,
 },
 TAHUN: {
  type: DataTypes.STRING
 },
 BULAN: {
  type: DataTypes.STRING
 },
 MULAI: {
  type: DataTypes.STRING
 },
 AKHIR: {
  type: DataTypes.STRING
 },
 JAMMULAI: {
  type: DataTypes.STRING
 },
 JAMAKHIR: {
  type: DataTypes.STRING
 },
 NOPERMIT: {
  type: DataTypes.STRING
 },
 PERUSAHAAN: {
  type: DataTypes.STRING
 },
 PEKERJA: {
  type: DataTypes.STRING
 },
 PEKERJAAN: {
  type: DataTypes.STRING
 },
 LOKASI: {
  type: DataTypes.STRING
 },
 TYPE: {
  type: DataTypes.STRING
 },
 PICUSER: {
  type: DataTypes.STRING
 },
 PICHSE: {
  type: DataTypes.STRING
 },
 RANK: {
  type: DataTypes.STRING
 },
 createdAt: {
  type: DataTypes.STRING
 },
 updatedAt: {
  type: DataTypes.STRING
 },
}, {
 freezeTableName: true,
 timestamps: false
});

export default MPermit