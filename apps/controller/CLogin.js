import { Op } from "sequelize";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import MAccess from "../../cfg/model/MAccess.js";
import MHRUser from "../../cfg/model/HRGA/User.js";
import moment from "moment";
import MPengguna from "../../cfg/model/MAccess.js";

export const Login = async (req, res) => {
	await MPengguna.findOne({
		raw: true, nest: true,
		where: { NIK: req.body.NIK }
	})
		.then(async (hs) => {
			if (hs !== null) {
				const hash = hs.PASSWORD.replace(/^\$2y(.+)$/i, '$2a$1');
				await bcrypt.compare(req.body.Password, hash)
					.then(async (compare) => {
						if (compare === true) {
							const NIK = hs.NIK
							const NAMA = hs.NAMA
							const DEPT = hs.DEPT
							const accessToken = jwt.sign({ NIK, NAMA, DEPT }, 'VMS', {
								expiresIn: '20s'
							})
							const refreshToken = jwt.sign({ NIK, NAMA, DEPT }, 'VMS', {
								expiresIn: '1d'
							})
							await MPengguna.update({ TOKEN: refreshToken, updatedAt: moment().format('YYYY-MM-DD HH:mm:ss') }, { where: { NIK: NIK } })
								.then((upd) => {
									res.json({ status: 1, refreshToken, msg: 'Welcome ' + hs.NAMA })
								})
								.catch((err) => {
									res.json({ status: 0, msg: 'Update Token Error' })
								})
						} else {
							res.json({ status: 0, msg: 'Password Salah' })
						}
					})
					.catch((err) => {
						console.log(err);
					})
			}
		})
}

export const refreshToken = async (req, res) => {
	const tkn = req.body.tkn;
	if (!tkn) {
		res.json({ 'status': 0, 'msg': 'Access Denied!!' })
	} else {
		await MPengguna.findOne({
			raw: true, nest: true,
			where: {
				TOKEN: tkn
			}
		})
			.then(async (hasil) => {
				if (!hasil) {
					res.json({ status: 0, msg: 'Not Found!!' })
				} else {
					if (tkn === hasil.TOKEN) {
						const NIK = hasil.NIK
						const NAMA = hasil.Nama
						const DEPT = hasil.DEPT
						const accessToken = jwt.sign({ NIK, NAMA, DEPT }, 'VMS', { expiresIn: '1d' });
						await MPengguna.update(
							{ TOKEN: accessToken },
							{
								where: {
									NIK: NIK
								}
							}
						)
							.then((hsl) => {
								res.json({ status: 1, refreshToken: accessToken })
							})
							.catch((err) => {
								console.log(err);
							})
					}
				}
			})
			.catch((err) => {
				console.log(err);
			})
	}
}

export const Logout = async (req, res) => {
	const tkn = req.headers['x-access-token'];
	await MPengguna.findOne({
		raw: true, nest: true,
		where: {
			TOKEN: tkn
		}
	})
		.then(async (hasil) => {
			await MHRUser.update({ REFRESHTOKEN: null, updatedAt: moment().format('YYYY-MM-DD HH:mm:ss') }, { where: { NIK: hasil.NIK } })
				.then(() => {
					res.json({ msg: `Bye ${hasil.Nama}` })
				})
				.catch((err) => {
					res.status(400).send({ msg: err })
				})
		})
		.catch((err) => {
			res.status(400).send({ msg: 'ACCESS DENIED!!!' })
		})
}

export const FindUser = async (req, res, data) => {
	res.json(req.user);
}

export const ListKaryawan = async (req, res) => {
	const data = []

	await MHRUser.findAll({
		raw: true, nest: true
	})
		.then(async (hs) => {
			for (let row = 0; row < hs.length; row++) {
				await MAccess.findOne(
					{
						raw: true, nest: true,
						where: {
							NIK: hs[row].NIK
						}
					}
				).then((ac) => {
					if (ac === null) {
						var Accs = null
						var Pass = null
						// const hash = req.body.PASS.replace(/^\$2y(.+)$/i, '$2a$1');
					} else {
						var Accs = ac.LEV
						var Pass = ac.PASSWORD.replace(/^\$2y(.+)$/i, '$2a$1')
					}
					data.push(
						{
							"NIK": hs[row].NIK,
							"NAMA": hs[row].Nama,
							"DEPT": hs[row].DEPT,
							"LEV": Accs,
							"PASS": Pass,
						}
					);
				})
			}
			res.json(data)
		})
}