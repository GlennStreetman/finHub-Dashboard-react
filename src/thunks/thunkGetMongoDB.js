import { createAsyncThunk } from '@reduxjs/toolkit';
//deletes stale data from mongo db
//retrieves fresh mongo data.
//returns fresh mongo data to update sliceShowData & slicefinnHubData
export const tGetMongoDB = createAsyncThunk( //{endPoint, [securityList]}
    'tgetMongoDb',
    async (req) => { //l{ist of securities} 
    try {
        // console.log("1running mongo refresh")
        const getData = await fetch('/finnDashData')
        const freshData = await getData.json()
        const resObj = {}
        for (const x in freshData.resList){
            const mongo = freshData.resList[x]
            resObj[mongo.key] = {
                updated: mongo.retrieved,
                stale: mongo.stale,
                data: mongo.data,
                key: mongo.key,
            }
        }
        // console.log('3resOBJ', freshData, resObj)
        console.log('-----------UPDATE FROM MONGO COMPLETE-------------')
        return(resObj)

    }catch(err){
        console.log('Error retrieving mongoDB', err)
        return('Problem retrieving mongo data')
    }
    })
        