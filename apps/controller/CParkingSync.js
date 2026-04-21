import axios from "axios";
import MMasterPark from "../../cfg/model/MMasterPark.js";
import MParkingLot from "../../cfg/model/MParkingLot.js";

const normalizeLotStatus = (value) => {
 const status = String(value || "").trim().toLowerCase();
 if (!status) return "AVAILABLE";
 if (["in", "use", "occupied", "terisi"].includes(status)) return "OCCUPIED";
 if (["reserved", "booked"].includes(status)) return "RESERVED";
 return "AVAILABLE";
};

export const BuildParkingSnapshot = async () => {
 const parks = await MMasterPark.findAll({
  raw: true,
  nest: true,
  order: [["PARKID", "ASC"]],
 });

 const slots = await MParkingLot.findAll({
  raw: true,
  nest: true,
  order: [["PARKID", "ASC"], ["DISPLAY", "ASC"]],
 });

 const parkMap = new Map(parks.map((park) => [String(park.PARKID), park]));

 const slotList = slots.map((slot) => {
  const park = parkMap.get(String(slot.PARKID));
  const normalizedStatus = normalizeLotStatus(slot.STATUS);

  return {
   id: slot.ID,
   park_id: slot.PARKID,
   park_name: park?.NAME || null,
   park_type: park?.JENIS || null,
   slot_number: slot.DISPLAY,
   raw_status: slot.STATUS,
   status: normalizedStatus,
   available: normalizedStatus === "AVAILABLE",
   occupied: normalizedStatus === "OCCUPIED",
   reserved: normalizedStatus === "RESERVED",
   card_id: slot.CARDID || null,
   visitor_name: slot.NAMA || null,
   vehicle_number: slot.TNKB || null,
   nik: slot.NIK || null,
   token: slot.TOKEN || null,
   check_in: slot.MULAI || null,
   check_out: slot.AKHIR || null,
   created_at: slot.CREATEDAT || null,
   updated_at: slot.UPDATEDAT || null,
  };
 });

 const summary = slotList.reduce((acc, slot) => {
  acc.total_slots += 1;
  if (slot.available) acc.available_slots += 1;
  else if (slot.occupied) acc.occupied_slots += 1;
  else if (slot.reserved) acc.reserved_slots += 1;
  else acc.unknown_slots += 1;
  return acc;
 }, {
  total_slots: 0,
  available_slots: 0,
  occupied_slots: 0,
  reserved_slots: 0,
  unknown_slots: 0,
 });

 return {
  generated_at: new Date().toISOString(),
  summary,
  slots: slotList,
 };
};

export const SendParkingSnapshotToSupplier = async (snapshot) => {
 const endpoint = process.env.PARKING_SUPPLIER_URL;

 if (!endpoint) {
  return {
   sent: false,
   reason: "PARKING_SUPPLIER_URL is not configured",
  };
 }

 const authHeader = process.env.PARKING_SUPPLIER_AUTH_HEADER || "Authorization";
 const authToken = process.env.PARKING_SUPPLIER_AUTH_TOKEN;
 const authPrefix = process.env.PARKING_SUPPLIER_AUTH_PREFIX || "Bearer";

 const headers = {
  "Content-Type": "application/json",
 };

 if (authToken) {
  headers[authHeader] = authPrefix ? `${authPrefix} ${authToken}` : authToken;
 }

 const response = await axios.post(endpoint, snapshot, { headers });

 return {
  sent: true,
  endpoint,
  status_code: response.status,
  response_body: response.data,
 };
};

export const ParkingSync = async (req, res) => {
 try {
  const snapshot = await BuildParkingSnapshot();
  const supplierResult = await SendParkingSnapshotToSupplier(snapshot);

  return res.json({
   status: 1,
   msg: supplierResult.sent
    ? "PARKING SYNC SUCCESS"
    : "SNAPSHOT READY, SUPPLIER URL NOT CONFIGURED",
   data: {
    ...snapshot,
    supplier_result: supplierResult,
   },
  });
 } catch (error) {
  console.error("ParkingSync error:", error);
  return res.status(500).json({
   status: 0,
   msg: "PARKING SYNC FAILED",
   error: error.message,
  });
 }
};

export const TriggerParkingSync = async () => {
 try {
  const snapshot = await BuildParkingSnapshot();
  return await SendParkingSnapshotToSupplier(snapshot);
 } catch (error) {
  console.error("TriggerParkingSync warning:", error.message);
  return {
   sent: false,
   reason: error.message,
  };
 }
};

const formatDateToDDMMYYYY = (value) => {
 if (!value) return null;

 const date = new Date(value);
 if (Number.isNaN(date.getTime())) return null;

 const day = String(date.getDate()).padStart(2, "0");
 const month = String(date.getMonth() + 1).padStart(2, "0");
 const year = date.getFullYear();

 return `${day}-${month}-${year}`;
};

const buildVehicleParkingAccessItem = async (item = {}) => {
 const parkId = item.parkId || item.PARKID || null;
 const display = item.display || item.DISPLAY || item.parkingNumber || null;

 let lot = null;
 let park = null;

 if (parkId && display) {
  lot = await MParkingLot.findOne({
   raw: true,
   nest: true,
   where: {
    PARKID: parkId,
    DISPLAY: display,
   },
  });
 }

 if (parkId) {
  park = await MMasterPark.findOne({
   raw: true,
   nest: true,
   where: { PARKID: parkId },
  });
 }

 const validFrom =
  item.validFrom ||
  item.startDate ||
  formatDateToDDMMYYYY(lot?.MULAI) ||
  formatDateToDDMMYYYY(new Date());

 const validUntil =
  item.validUntil ||
  item.endDate ||
  formatDateToDDMMYYYY(lot?.AKHIR) ||
  validFrom;

 return {
  vehicleSubmissionId: item.vehicleSubmissionId,
  parkingNumber: item.parkingNumber || display || lot?.DISPLAY || null,
  parkingName: item.parkingName || park?.NAME || display || lot?.DISPLAY || null,
  validFrom,
  validUntil,
 };
};

export const SendVehicleParkingAccessToSupplier = async (payload) => {
 const endpoint = process.env.PARKING_SUPPLIER_URL;

 if (!endpoint) {
  return {
   sent: false,
   reason: "PARKING_SUPPLIER_URL is not configured",
  };
 }

 const authHeader = process.env.PARKING_SUPPLIER_AUTH_HEADER || "Authorization";
 const authToken = process.env.PARKING_SUPPLIER_AUTH_TOKEN;
 const authPrefix = process.env.PARKING_SUPPLIER_AUTH_PREFIX || "Bearer";

 const headers = {
  "Content-Type": "application/json",
 };

 if (authToken) {
  headers[authHeader] = authPrefix ? `${authPrefix} ${authToken}` : authToken;
 }

 const response = await axios.post(endpoint, payload, { headers });

 return {
  sent: true,
  endpoint,
  status_code: response.status,
  response_body: response.data,
 };
};

export const VehicleParkingAccessSync = async (req, res) => {
 try {
  const inputData = Array.isArray(req.body?.data) ? req.body.data : [];

  if (!inputData.length) {
   return res.status(400).json({
    status: 0,
    msg: "data wajib diisi dan harus berupa array",
   });
  }

  const missingSubmissionId = inputData.find((item) => !item?.vehicleSubmissionId);
  if (missingSubmissionId) {
   return res.status(400).json({
    status: 0,
    msg: "vehicleSubmissionId wajib diisi untuk setiap item",
   });
  }

  const data = [];
  for (const item of inputData) {
   data.push(await buildVehicleParkingAccessItem(item));
  }

  const payload = { data };
  const supplierResult = await SendVehicleParkingAccessToSupplier(payload);

  return res.json({
   status: 1,
   msg: supplierResult.sent ? "VEHICLE PARKING ACCESS SYNC SUCCESS" : "SUPPLIER URL NOT CONFIGURED",
   payload,
   supplier_result: supplierResult,
  });
 } catch (error) {
  console.error("VehicleParkingAccessSync error:", error);
  return res.status(500).json({
   status: 0,
   msg: "VEHICLE PARKING ACCESS SYNC FAILED",
   error: error.message,
  });
 }
};
