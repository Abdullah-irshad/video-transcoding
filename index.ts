import express from 'express'
import dotenv  from 'dotenv';
dotenv.configDotenv({
    path: './.env'
})
const app  = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use((req,res,next)=>{
    res.header('Access-Control-Allow-Origin','*');
    res.header('Access-Control-Allow-Headers','Origin, X-Requested-With, Content-Type, Accept');
    next();
})
const path = "/Users/mohdabdullaha/Desktop/VideoTranscodingPOC/transcoded";
app.use("/transcoded", express.static(path));

////// Routes

import {fileRouter} from './src/routes/fileRouter';
app.use('/api/file',fileRouter);



app.listen(8000,()=>{
    console.log("server is running")
})
