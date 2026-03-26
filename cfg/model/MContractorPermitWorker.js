import { Sequelize } from "sequelize";
import HRGA from "../conn/HRGA.js";

const { DataTypes } = Sequelize;

const MContractorPermitWorker = HRGA.define(
 "contractor_permit_workers",
 {
  id: {
   type: DataTypes.INTEGER,
   primaryKey: true,
  },
  permit_token: {
   type: DataTypes.STRING,
  },
  nama_pekerja: {
   type: DataTypes.STRING,
  },
  identitas_no: {
   type: DataTypes.STRING,
  },
  status_absensi: {
   type: DataTypes.STRING,
  },
  created_at: {
   type: DataTypes.DATE,
  },
  updated_at: {
   type: DataTypes.DATE,
  },
  qr_token: {
   type: DataTypes.STRING,
  },
 },
 {
  freezeTableName: true,
  timestamps: false,
 }
);

export default MContractorPermitWorker;
