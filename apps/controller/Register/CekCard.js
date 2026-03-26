import db from "../../../cfg/model/index.js";
const normalizeStatus = (value) => String(value || "").trim().toLowerCase();
const resolveFlowStatus = ({ lastStatus }) => {
 const status = normalizeStatus(lastStatus);
 if (!status) return "In";
 if (status === "in") return "Out";
 if (status === "out") return "In";
 return "In";
};

export const CekCard = async (req, res) => {
 const { CARDID } = req.body;
 try {
  const card = await db.MCard.findOne({
   where: { CARDID },
   raw: true, nest: true
  });

  if (!card) return res.status(404).json({ msg: "Card not found" });

  const latestTrans = await db.MTrans.findOne({
   where: { CARDID },
   order: [["createdAt", "DESC"]],
   raw: true,
   nest: true,
  });
  const startDate = latestTrans?.MULAI || null;
  const endDate = latestTrans?.AKHIR || null;
  const flowStatus = resolveFlowStatus({
   lastStatus: latestTrans?.STATUS,
  });

  const isCheckOutFlow = flowStatus === "Out";
  const normalizedData = isCheckOutFlow
   ? {
      transId: latestTrans?.TRANSID || card?.TOKEN || null,
      cardId: card?.CARDID || latestTrans?.CARDID || null,
      nama: latestTrans?.NAMA || null,
      perusahaan: latestTrans?.PERUSAHAAN || null,
      penerima: latestTrans?.KARYAWAN || null,
      jumlah: Number(latestTrans?.JUMLAH || 1),
      keperluan: latestTrans?.KEPERLUAN || null,
      KTP: latestTrans?.KTP || null,
      FOTO: latestTrans?.FOTO || null,
      status: normalizeStatus(latestTrans?.STATUS || ""),
      parkId: latestTrans?.PARKID || null,
      display: latestTrans?.DISPLAY || null,
      jenis: latestTrans?.JENIS || null,
      platNomor: latestTrans?.TNKB || null,
      createdAt: latestTrans?.createdAt || null,
      updatedAt: latestTrans?.updatedAt || null,
      startDate,
      endDate,
      source: "card",
      token: latestTrans?.TRANSID || card?.TOKEN || null,
     }
   : {
      transId: null,
      cardId: card?.CARDID || null,
      nama: "",
      perusahaan: "",
      penerima: "",
      jumlah: 1,
      keperluan: "",
      KTP: null,
      FOTO: null,
      status: "",
      parkId: null,
      display: null,
      jenis: null,
      platNomor: "",
      createdAt: null,
      updatedAt: null,
      startDate,
      endDate,
      source: "card",
      token: card?.TOKEN || null,
     };

  return res.json({
   status: flowStatus,
   data: normalizedData,
   token: normalizedData.token,
   source: "card",
  });

 } catch (error) {
  console.log(error);
  res.status(500).json({ msg: "Internal server error" });
 }
};
