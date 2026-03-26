import MPerm from "../../cfg/model/MPerm.js"

export const ListPerm = async (req, res) => {
  const find = await MPerm.findAll({ raw: true, nest: true })
  if (find) {
    res.json(find)
  }else{
    res.json({status: 0, msg: 'EERR'})
  }
}
export const FindPermByParkId = async (req, res) => {
  const find = await MPerm.findAll({
    raw: true, nest: true,
    where: {
      PARKID: req.body.PARKID
    }
  })
  if (res !== 'ret') {
    res.json(find)
  } else {
    return (find)
  }
}
export const FindPermByDisplay = async (req, res) => {
  const data = []
  await MPerm.findOne({
    raw: true, nest: true,
    where: {
      DISPLAY: req.body.DISPLAY
    }
  })
    .then((hs) => {
      data.push(hs)
    })
    .catch((err) => {
      // res.json({ msg: undefined })
    })
  if (res !== 'ret') {
    res.json(data[0])
  } else {
    return (data[0])
  }
}