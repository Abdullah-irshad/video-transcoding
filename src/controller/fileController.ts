import { Request, Response } from "express";
import { FFmpeg } from "../lib/ffmpeg";
import fs from 'fs';
import { getUuid } from "../util/uuid";

const  ffmpegInstance = FFmpeg.getInstance();

 async function uploadFile(req: Request, res:Response) {
    if(req.file){
        try{
            const uuid:string = getUuid();
            await ffmpegInstance.convert(req.file.path,uuid)
            res.status(200).json({
                success:true,
                message:"File uploaded",
            })
            await ffmpegInstance.extractAudio(req.file.path,uuid)
        }catch(err){
            res.status(500).json({
                success:false,
                message: (err instanceof Error) ? err.message : 'An unknown error occurred'
            });
        }
    }else{
        res.status(400).json({
            success:false,
            message:"File not uploaded"
        });
    }
}

let path:string = "/Users/mohdabdullaha/Desktop/VideoTranscodingPOC/transcoded";

function getFile(req: Request, res:Response) {
    fs.readdir(path, (err, files) => {
        if (err) {
            res.status(500).json({
                success:false,
                message: (err instanceof Error) ? err.message : 'An unknown error occurred'
            });
        } else {
            const videUrls = files.map(file=>{
                return `http://localhost:8000/transcoded/${file}/index.m3u8`
            })
            res.status(200).json({
                success:true,
                path: videUrls
            });
        }
    })
}





export{
    uploadFile,
    getFile
}