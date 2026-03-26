import { Sequelize } from "sequelize";
import vms from "../conn/VMS.js";

const { DataTypes } = Sequelize

const MMasterVehicle = vms.define('MASTER_VEHICLECATEGORY', {
 Id: {
  type: DataTypes.STRING,
  primaryKey: true,
  autoIncrement: true
 },
 Vehicle: {
  type: DataTypes.STRING
 },
 Icon: {
  type: DataTypes.STRING
 },
}, {
 freezeTableName: true,
 timestamps: false
});

export default MMasterVehicle