import { Sequelize } from "sequelize";
import HRGA from "../../conn/HRGA.js";

const { DataTypes } = Sequelize

const MHRUser = HRGA.define('USER', {
 NIK: {
  type: DataTypes.STRING,
  primaryKey: true
 },
 Nama: {
  type: DataTypes.STRING
 },
 PASSWORD: {
  type: DataTypes.STRING
 },
 TOKEN: {
  type: DataTypes.STRING
 },
 REFRESHTOKEN: {
  type: DataTypes.STRING
 },
 DEPT: {
  type: DataTypes.STRING
 }
}, {
 freezeTableName: true,
 timestamps: false
});

export default MHRUser