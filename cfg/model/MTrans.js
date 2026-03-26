import { Sequelize } from "sequelize";
import vms from "../conn/VMS.js";

const { DataTypes } = Sequelize

const MTrans = vms.define('TRANSACTIONS', {
 TRANSID: {
  type: DataTypes.STRING,
  primaryKey: true,
 },
 CARDID: {
  type: DataTypes.STRING
 },
 PARKID: {
  type: DataTypes.STRING
 },
 DISPLAY: {
  type: DataTypes.STRING
 },
 NAMA: {
  type: DataTypes.STRING
 },
 TNKB: {
  type: DataTypes.STRING
 },
 JENIS: {
  type: DataTypes.STRING
 },
 JUMLAH: {
  type: DataTypes.STRING
 },
 KARYAWAN: {
  type: DataTypes.STRING
 },
 KEPERLUAN: {
  type: DataTypes.STRING
 },
 AKTIFITAS: {
  type: DataTypes.STRING
 },
 PERUSAHAAN: {
  type: DataTypes.STRING
 },
 KTP: {
  type: DataTypes.STRING
 },
 FOTO: {
  type: DataTypes.STRING
 },
 MULAI: {
  type: DataTypes.STRING
 },
 AKHIR: {
  type: DataTypes.STRING
 },
 STATUS: {
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

export default MTrans