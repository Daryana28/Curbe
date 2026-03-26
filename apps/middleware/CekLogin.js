import jwt from 'jsonwebtoken'
import MAccess from '../../cfg/model/MAccess.js';

export const CekLogin = async (req, res, next) => {
 const TOKEN = req.headers["x-access-token"];
 if (!TOKEN) {
  console.warn("CekLogin blocked request: missing token", req.method, req.originalUrl);
  res.json({ status: 0, msg: "Unauthorize" })
 } else {
  try {
   const decoded = jwt.verify(TOKEN, 'VMS')
   await MAccess.findOne(
    {
     raw: true, nest: true,
     where: {NIK: decoded.NIK}
    }
    ).then((access)=>{
     req.user = (
     {
      NIK: access.NIK, 
      NAMA: access.NAMA, 
      DEPT: access.DEPT, 
      LEV: access.LEV, 
     });
    // req.user = {decoded, access}
    return next()
   })
  } catch (err) {
   console.warn("CekLogin blocked request: invalid token", req.method, req.originalUrl, err?.message);
   res.json({ status: 0, msg: "Unauthorize" + err })
  }
 }
}
