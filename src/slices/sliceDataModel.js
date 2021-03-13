import { createSlice } from '@reduxjs/toolkit';
import { widgetDict } from '../registers/endPointsReg.js';
import { tGetFinnhubData } from '../thunks/thunkFetchFinnhub.js';
import { tGetMongoDB } from '../thunks/thunkGetMongoDB.js';
const initialState = {
    dataSet: {},
    created: false,
};
const dataModel = createSlice({
    name: 'finnHubData',
    initialState,
    reducers: {
        rBuildDataModel: (state, action) => {
            //receivies dashboard object and builds dataset from scratch.
            console.log('BUILDING');
            const flag = state.created === false ? true : 'updated';
            console.log("Building DATASET", flag);
            const ap = action.payload;
            const apD = ap.dashBoardData;
            const resList = [];
            const endPointAPIList = {}; //list of lists. Each list []
            //nested loops that create a list of endpoints for this dataset.
            for (const d in apD) { //for each dashboard
                const widgetList = apD[d].widgetlist;
                for (const w in widgetList) { //for each widget
                    const widgetName = w;
                    if (w !== null && w !== 'null') {
                        const endPoint = widgetList[w].widgetType;
                        const filters = widgetList[w].filters;
                        // @ts-ignore: Unreachable code error
                        const endPointFunction = widgetDict[endPoint]; //returns function that generates finnhub API strings
                        const trackedStocks = widgetList[w].trackedStocks;
                        const endPointData = endPointFunction(trackedStocks, filters, ap.apiKey);
                        delete endPointData.undefined;
                        endPointAPIList[widgetName] = endPointData;
                        for (const s in trackedStocks) {
                            if (trackedStocks[s].key !== undefined) {
                                const key = trackedStocks[s].key;
                                const dataName = `${widgetName}-${key}`;
                                resList.push(dataName);
                            }
                        }
                    }
                }
            }
            for (const x in state.dataSet) {
                //if resList item exists in old list, delete from reslist, else delete from oldState
                resList.indexOf(x) > -1 ?
                    resList.splice(resList.indexOf(x), 1) :
                    delete state.dataSet[x];
            }
            for (const x of resList) { //Map remainnig resList items into state.
                state.dataSet[x] = {};
            }
            for (const widget in endPointAPIList) {
                const thisWidget = endPointAPIList[widget];
                for (const security in thisWidget) {
                    const widgetString = `${widget}-${security}`;
                    state.dataSet[widgetString] = { apiString: thisWidget[security] };
                }
            }
            state.created = flag;
        },
        rResetUpdateFlag: (state) => {
            state.created = true;
        },
    },
    extraReducers: {
        // @ts-ignore: Unreachable code error
        [tGetFinnhubData.pending]: (state, actiony) => {
            // console.log('1. Getting stock data!')
            // return {...state}
        },
        // @ts-ignore: Unreachable code error
        [tGetFinnhubData.rejected]: (state, action) => {
            console.log('2. failed to retrieve stock data for: ', action);
            // return {...state}
        },
        // @ts-ignore: Unreachable code error
        [tGetFinnhubData.fulfilled]: (state, action) => {
            // console.log("3 UPDATA DATA STORE:", action.payload)
            const ap = action.payload;
            for (const x in ap) {
                const updateObj = {
                    apiString: ap[x].apiString,
                    updated: ap[x].updated,
                    // data: ap[x].data,
                };
                state.dataSet[x] = updateObj;
            }
        },
        // @ts-ignore: Unreachable code error
        [tGetMongoDB.pending]: (state, action) => {
            // console.log('1. Getting stock data!')
            // return {...state}
        },
        // @ts-ignore: Unreachable code error
        [tGetMongoDB.rejected]: (state, action) => {
            console.log('2. failed showData from Mongo: ', action);
            // return {...state}
        },
        // @ts-ignore: Unreachable code error
        [tGetMongoDB.fulfilled]: (state, action) => {
            console.log("Merge update fields into dataSet from mongoDB");
            const ap = action.payload;
            for (const x in ap) {
                const apiString = ap[x].key;
                const updated = ap[x].updated;
                const stale = ap[x].stale;
                // console.log('stale', stale)
                if (state.dataSet[apiString] !== undefined) {
                    state.dataSet[apiString].updated = updated;
                    state.dataSet[apiString].stale = stale;
                }
            }
        },
    }
});
export const { rBuildDataModel, rResetUpdateFlag, } = dataModel.actions;
export default dataModel.reducer;