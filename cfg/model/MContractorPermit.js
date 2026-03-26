import { Sequelize } from "sequelize";
import HRGA from "../conn/HRGA.js";

const { DataTypes } = Sequelize;

const MContractorPermit = HRGA.define(
 "contractor_permits",
 {
  id: {
   type: DataTypes.INTEGER,
   primaryKey: true,
  },
  token: {
   type: DataTypes.STRING,
  },
  no_permit: {
   type: DataTypes.STRING,
  },
  bulan: {
   type: DataTypes.STRING,
  },
  perusahaan: {
   type: DataTypes.STRING,
  },
  tipe_pekerjaan: {
   type: DataTypes.STRING,
  },
  pekerjaan: {
   type: DataTypes.STRING,
  },
  lokasi: {
   type: DataTypes.STRING,
  },
  tgl_mulai: {
   type: DataTypes.DATE,
  },
  tgl_akhir: {
   type: DataTypes.DATE,
  },
  jam_mulai: {
   type: DataTypes.STRING,
  },
  jam_akhir: {
   type: DataTypes.STRING,
  },
  daftar_pekerja: {
   type: DataTypes.TEXT,
  },
  pic_user: {
   type: DataTypes.STRING,
  },
  pic_hse: {
   type: DataTypes.STRING,
  },
  rank: {
   type: DataTypes.STRING,
  },
  created_at: {
   type: DataTypes.DATE,
  },
  updated_at: {
   type: DataTypes.DATE,
  },
 },
 {
  freezeTableName: true,
  timestamps: false,
 }
);

export default MContractorPermit;
