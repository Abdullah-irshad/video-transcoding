import multer from "multer"
import {v4 as uuid} from 'uuid'
import path from "path";


const storage = multer.diskStorage({
    destination:  function(req,file,cb){
        cb(null,"./src/uploads");
    },
    filename: function(req,file,cb){
        cb(null,file.fieldname +"-"+uuid()+path.extname(file.originalname));
    }
})

const upload = multer({
    storage:storage
})

export{
    upload
}