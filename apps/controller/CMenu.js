import MMenu from "../../cfg/model/MMenu.js"

export const ListMenu = async (req, res) => {
 if (req.body === undefined) {
  const find = await MMenu.findAll(
   {
    raw: true, nest: true,
    where: {
     Kategori: req.cat
    }
   }
  )
  return find
 } else {
  const find = await MMenu.findAll(
   {
    raw: true, nest: true,
    where: {
     Kategori: req.body.cat
    }
   }
  )
  res.json(find)
 }
}