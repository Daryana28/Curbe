import axios from "axios";
import https from "https";

export const GetVisitorList = async (req, res) => {
 try {
  const { start_date, end_date } = req.body || {};

  const response = await axios.post(
   "https://pik1svr008.local.ikoito.co.id:5002/visitor/getListVisitor",
   {
    start_date,
    end_date,
   },
   {
    headers: {
     "Content-Type": "application/json",
     Accept: "application/json",
    },
    httpsAgent: new https.Agent({
     rejectUnauthorized: false,
    }),
   }
  );

  return res.json(response?.data?.data || response?.data || []);
 } catch (error) {
  console.error("GetVisitorList Error:", error?.response?.data || error.message);
  return res.status(error?.response?.status || 500).json({
   status: 0,
   message:
    error?.response?.data?.message ||
    error?.response?.data?.msg ||
    "Gagal mengambil data visitor.",
  });
 }
};
