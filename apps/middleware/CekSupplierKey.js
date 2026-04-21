export const CekSupplierKey = (req, res, next) => {
 const configuredKey = process.env.PARKING_SUPPLIER_GET_KEY;

 if (!configuredKey) {
  return res.status(503).json({
   status: 0,
   msg: "SUPPLIER KEY NOT CONFIGURED",
  });
 }

 const bearerToken = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
 const apiKey = String(req.headers["x-api-key"] || "").trim();

 if (bearerToken === configuredKey || apiKey === configuredKey) {
  return next();
 }

 return res.status(401).json({
  status: 0,
  msg: "UNAUTHORIZED SUPPLIER ACCESS",
 });
};
