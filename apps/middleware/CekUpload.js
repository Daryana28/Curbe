import multer from "multer";
import {fileURLToPath} from 'url';
import path, {dirname} from "path";

const __filename =fileURLToPath(import.meta.url);
const __basedir = dirname(__filename);
const fd = path.join(__basedir, "../");

const storage = multer.diskStorage({
 // destination: (req, file, cb)=>{
 //  cb(null, fd+"../res/InternalNews")
 // },
 filename: (req, file, cb)=>{
  cb(null, `${Date.now()}-Internal-${file.originalname}`);
 }
})
export const CekUpload = multer({storage: storage})