export const TransOut = async (req, res) => {
 try {
  const { CARDID, JENIS, DISPLAY, PARKID, TRANSID, checkoutNote } = req.body;

  if (!CARDID || !TRANSID) {
   return res.status(400).json({ success: false, message: "Data tidak lengkap" });
  }

  // Update kartu
  const saveCard = await MCard.update(
   { Status: null, TOKEN: null },
   { where: { CARDID } }
  );

  if (JENIS !== 'BERJALAN' || JENIS !== 'TRUCK') {
   // Kosongkan lot parkir
   const lot = await MParkingLot.update(
    {
     CARDID: null,
     JENIS: null,
     STATUS: null,
     TOKEN: null,
     NAMA: null,
     TNKB: null,
    },
    { where: { DISPLAY, PARKID } }
   );
  }

  // Update transaksi
  const saveTrans = await MTrans.update(
   {
    AKHIR: moment().format("YYYY-MM-DD HH:mm:ss"),
    STATUS: "out",
    NOTE: checkoutNote || null, // simpan catatan checkout
   },
   { where: { TRANSID } }
  );

  return res.status(200).json({ success: true, message: "Check Out berhasil" });
 } catch (error) {
  console.error("TransOut error:", error);
  return res.status(500).json({ success: false, message: "Server error", error });
 }
};