import { createAsyncThunk } from '@reduxjs/toolkit';
import { reqObj, resObj } from '../server/routes/mongoDB/findMongoData'
//receives list of strings to search for. WidgetKey-targetSecurity
//pushes returned string to visableData in redux.
export const tSearchMongoDB = createAsyncThunk( //{ [widgetKey-securityList]}
    'tSearch',
    async (req: string[], thunkAPI: any) => { //{list of securities}
        //if stale pop from list 
        const dashboard = thunkAPI.getState().showData.targetDashboard
        const reqData: reqObj = {
            searchList: req,
            dashboard: dashboard
        }
        try {
            const options = {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(reqData),
            };
            const getData = await fetch('/findMongoData', options)
            const resData: resObj[] = await getData.json()
            const res = req.reduce((acc, curr) => ({ ...acc, [`${dashboard}-${curr}`]: '' }), {});
            for (const x in resData) {
                const mongo: resObj = resData[x]
                res[mongo.key] = {
                    updated: mongo.retrieved,
                    stale: mongo.stale,
                    data: mongo.data,
                    key: mongo.key,
                    dashboard: mongo.dashboard,
                    widget: mongo.widget,
                    security: mongo.security,
                    widgetType: mongo.widgetType,
                }
            }
            return (res)
        } catch (err) {
            console.log('Error retrieving mongoDB', err)
            return ('Problem retrieving mongo data')
        }
    })
