import { Sequelize } from "sequelize";
import vms from "../conn/VMS.js";

const { DataTypes } = Sequelize

const MMasterPark = vms.define('MASTERPARK', {
 PARKID: {
  type: DataTypes.STRING,
  primaryKey: true,
  autoIncrement: true
 },
 NAME: {
  type: DataTypes.STRING
 },
 JENIS: {
  type: DataTypes.STRING
 },
 ROW: {
  type: DataTypes.STRING
 },
 COL: {
  type: DataTypes.STRING
 },
}, {
 freezeTableName: true,
 timestamps: false
});

export default MMasterPark