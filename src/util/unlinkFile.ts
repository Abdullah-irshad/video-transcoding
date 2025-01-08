import fs from 'fs'


function unlink(path:string){
    return new Promise((resolve,reject)=>{
        fs.unlink(path,(err)=>{
            if(err){
                reject(err);
            }else{
                resolve("removed");
            }
        })
    })
}

export{
    unlink
}