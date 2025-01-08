import {Router} from 'express';
import { getFile, uploadFile } from '../controller/fileController';
import { upload } from '../middleware/multerMiddleware';

const fileRouter = Router();

fileRouter.post('/upload',upload.single('file'),uploadFile);
fileRouter.get('/files',getFile);

export{
    fileRouter
}