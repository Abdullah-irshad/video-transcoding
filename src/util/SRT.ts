import fs from 'fs';

const formatToSRT = (text: string) => {
    let srt = '';
    text.split('. ').forEach((sentence, index) => {
      const start = `00:00:0${index},000`;
      const end = `00:00:0${index + 5},000`; // Dummy timestamps, adjust as needed
      srt += `${index + 1}\n`;
      srt += `${start} --> ${end}\n`;
      srt += `${sentence}\n\n`;
    });
    return srt;
  };



  const saveSRT = (srt: string,uuid:string) => {
  console.log("called");
   try{
    const path = `../subtitles/${uuid}`;
    const filePath = `${path}/subtitle.srt`;
    if(!fs.existsSync(path)){
      fs.mkdirSync(path,{recursive:true});
    }
    fs.writeFileSync(filePath,srt);
   }catch(err){
    console.log(err);
   }
  }



  export { formatToSRT, saveSRT };