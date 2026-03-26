import MTrans from "../../../cfg/model/MTrans.js";

export const CekTrans = async (req, res) => {
 const body = req?.body || {};
 const isInternalCall = res === "ret" || body?.ret === "ret" || typeof res?.status !== "function";

 try {
  const { TRANSID } = body;
  // Validasi input
  if (!TRANSID) {
   if (isInternalCall) return null;
   return res.status(400).json({
    status: "error",
    message: "TRANSID wajib diisi",
   });
  }

  const cek = await MTrans.findOne({
   raw: true,
   nest: true,
   where: { TRANSID },
  });
console.log(`cektranslog${TRANSID}`);

  // Jika mode internal/helper, kembalikan data langsung.
  if (isInternalCall) {
   return cek;
  }

  // Default response API
  if (cek) {
   return res.status(200).json(cek);
  } else {
   return res.status(404).json({
    status: "not_found",
    message: "Data transaksi tidak ditemukan",
   });
  }
 } catch (error) {
  console.error("Error CekTrans:", error);

  if (isInternalCall) {
   return null;
  }

  return res.status(500).json({ error: error.message });
 }
};
