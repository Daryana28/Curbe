import { Sequelize } from "sequelize";
import vms from "../conn/VMS.js";

const { DataTypes } = Sequelize

const MCard = vms.define('MASTERCARD', {
 CARDID: {
  type: DataTypes.STRING,
  primaryKey: true,
 },
 Serial_Number: {
  type: DataTypes.STRING
 },
 Card_Code: {
  type: DataTypes.STRING
 },
 Card_Desc: {
  type: DataTypes.STRING
 },
 Status: {
  type: DataTypes.STRING
 },
 TOKEN: {
  type: DataTypes.STRING
 },
}, {
 freezeTableName: true,
 timestamps: false
});

export default MCard