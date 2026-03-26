import { Sequelize } from "sequelize";
import vms from "../conn/VMS.js";

const { DataTypes } = Sequelize;

const MLog = vms.define("LOGS", {
 id: {
  type: DataTypes.INTEGER,
  primaryKey: true,
  autoIncrement: true,
 },
 act: {
  type: DataTypes.STRING,
 },
 createdAt: {
  type: DataTypes.DATE,
 },
 updatedAt: {
  type: DataTypes.DATE,
 },
}, {
 freezeTableName: true,
 timestamps: false,
});

export default MLog;
