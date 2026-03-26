import Sequelize from "sequelize";
import sequelize from "../../cfg/conn/VMS.js";
import MCard from "./MCard.js";
import MTrans from "./MTrans.js";
import MPerm from "./MPerm.js";
import MMasterPark from "./MMasterPark.js";

const db = {
 sequelize,
 Sequelize,
 MCard,
 MTrans,
 MMasterPark
};

// ====== Relasi Card ↔ Trans berdasarkan CARDID ======
MCard.hasOne(MTrans, {
 foreignKey: "CARDID",
 sourceKey: "CARDID",
 as: "transactionCard",
});

MTrans.belongsTo(MCard, {
 foreignKey: "CARDID",
 targetKey: "CARDID",
 as: "cardOfTransaction",
});

// ====== Relasi Card ↔ Trans berdasarkan TOKEN ↔ TRANSID ======
MCard.hasOne(MTrans, {
 foreignKey: "TRANSID", // kolom di MTrans
 sourceKey: "TOKEN",    // kolom di MCard
 as: "transactionCardToken",
});

MTrans.belongsTo(MCard, {
 foreignKey: "TRANSID", // kolom di MTrans
 targetKey: "TOKEN",    // kolom di MCard
 as: "cardOfTransactionToken",
});

// ====== Relasi Card ↔ Perm ======
MCard.hasOne(MPerm, {
 foreignKey: "CARDID",
 sourceKey: "CARDID",
 as: "permanentCard",
});

MPerm.belongsTo(MCard, {
 foreignKey: "CARDID",
 targetKey: "CARDID",
 as: "cardPermanent",
});

// ====== Relasi Perm ↔ MasterPark ======
MPerm.belongsTo(MMasterPark, {
 foreignKey: "PARKID",   // kolom di tabel MPerm
 targetKey: "PARKID",    // kolom di tabel MMasterPark
 as: "masterPark",
});

MMasterPark.hasMany(MPerm, {
 foreignKey: "PARKID",   // kolom di tabel MPerm
 sourceKey: "PARKID",    // kolom di tabel MMasterPark
 as: "permits",
});

/* ========== Run associate() if exists ========== */
Object.values(db).forEach((model) => {
 if (model?.associate) {
  model.associate(db);
 }
});

export default db;
