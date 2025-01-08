import {v4 as uuid} from "uuid"


function getUuid(){
    return uuid();
}


export{
    getUuid
}