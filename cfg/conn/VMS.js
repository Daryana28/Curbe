import { Sequelize } from "sequelize";

const vms = new Sequelize('VMSDB', 'AppPIK', 'k02t04dm1n', {
 host: '172.17.100.9',
 dialect: 'mssql',
 pool: {
  max: 20,
  min: 0,
  acquire: 60000,
  idle: 10000,
 }
})

export default vms