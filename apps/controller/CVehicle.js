import MMasterVehicle from "../../cfg/model/MMasterVehicle.js"

export const ListVehicle = async(req, res)=>{
 await MMasterVehicle.findAll({raw: true, nest: true})
 .then((hs)=>{
  res.json(hs)
 })
 .catch((err)=>{
  res.json({status: 0, msg: err})
 })
} 