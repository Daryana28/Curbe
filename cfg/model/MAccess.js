import { Sequelize } from "sequelize";
import vms from "../conn/VMS.js";

const { DataTypes } = Sequelize

const MPengguna = vms.define('PENGGUNA', {
 NIK: {
  type: DataTypes.STRING,
  primaryKey: true,
 },
 NAMA: {
  type: DataTypes.STRING
 },
 PASSWORD: {
  type: DataTypes.STRING
 },
 DEPT: {
  type: DataTypes.STRING
 },
 LEV: {
  type: DataTypes.STRING
 },
 TOKEN: {
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

export default MPengguna