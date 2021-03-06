import * as React from "react"
import { useState, forwardRef, useRef, useMemo } from "react";

import { useAppDispatch, useAppSelector } from '../../../hooks';

import { convertCamelToProper } from '../../../appFunctions/stringFunctions'

//hooks
import { useDragCopy } from './../../widgetHooks/useDragCopy'
import { useSearchMongoDb } from '../../widgetHooks/useSearchMongoDB'
import { useBuildVisableData } from '../../widgetHooks/useBuildVisableData'
import { useUpdateFocus } from './../../widgetHooks/useUpdateFocus'

//widget components
import StockSearchPane, { searchPaneProps } from "../../../components/stockSearchPaneFunc";
import WidgetFocus from '../../../components/widgetFocus'
import WidgetRemoveSecurityTable from '../../../components/widgetRemoveSecurityTable'
// import { dStock } from './../../../appFunctions/formatStockSymbols'

const useDispatch = useAppDispatch
const useSelector = useAppSelector

function PriceTargetBody(p: { [key: string]: any }, ref: any) {
    const isInitialMount = useRef(true); //update to false after first render.

    const startingWidgetCoptyRef = () => {
        if (isInitialMount.current === true) {
            if (p.widgetCopy !== undefined && p.widgetCopy.widgetID !== null) {
                return p.widgetCopy.widgetID
            } else { return -1 }
        }
    }

    const [widgetCopy] = useState(startingWidgetCoptyRef())
    const dispatch = useDispatch(); //allows widget to run redux actions.

    const rShowData = useSelector((state) => { //REDUX Data associated with this widget.
        if (state.dataModel !== undefined &&
            state.dataModel.created !== 'false' &&
            state.showData.dataSet[p.widgetKey] !== undefined) {
            const showData: object = state.showData.dataSet[p.widgetKey][p.config.targetSecurity]
            return (showData)
        }
    })

    const focusSecurityList = useMemo(() => { //remove if all securities should stay in focus.
        return [p?.config?.targetSecurity]
    }, [p?.config?.targetSecurity])

    useDragCopy(ref, {})//useImperativeHandle. Saves state on drag. Dragging widget pops widget out of component array causing 
    useUpdateFocus(p.targetSecurity, p.updateWidgetConfig, p.widgetKey, p.config.targetSecurity) //sets security focus in config. Used for redux.visable data and widget excel templating.
    useSearchMongoDb(p.currentDashBoard, p.finnHubQueue, p.config.targetSecurity, p.widgetKey, widgetCopy, dispatch, isInitialMount) //on change to target security retrieve fresh data from mongoDB
    useBuildVisableData(focusSecurityList, p.widgetKey, widgetCopy, dispatch, isInitialMount) //rebuild visable data on update to target security

    function renderSearchPane() {

        let stockTable = (
            <WidgetRemoveSecurityTable
                trackedStocks={p.trackedStocks}
                widgetKey={p.widgetKey}
                updateWidgetStockList={p.updateWidgetStockList}
                exchangeList={p.exchangeList}
            />
        );
        return stockTable
    }

    function renderStockData() {
        const parseList = ['targetHigh', 'targetLow', 'targetMean', 'targetMedian']

        const stockDataRows = rShowData ? Object.keys(rShowData).map((el) =>
            <tr key={el + "row"}>
                <td className='rightTE' key={el + "symbol"}>{convertCamelToProper(el)}: &nbsp;&nbsp;</td>
                <td key={el + "name"}>{parseList.includes(el) ? parseInt(rShowData[el]).toFixed(2) : rShowData[el]}</td>
            </tr>
        ) : <></>
        return <>
            <WidgetFocus
                widgetType={p.widgetType} updateWidgetConfig={p.updateWidgetConfig}
                widgetKey={p.widgetKey}
                trackedStocks={p.trackedStocks}
                exchangeList={p.exchangeList}
                config={p.config}
            />
            <div className='scrollableDiv'>
                <table className='dataTable'>
                    <thead>
                        <tr>
                            <td>Heading</td>
                            <td>Value</td>
                        </tr>
                    </thead>
                    <tbody data-testid='ptRow'>
                        {stockDataRows}
                    </tbody>
                </table>
            </div>
        </>
    }

    return (
        <div data-testid='priceTargetBody' >
            {p.showEditPane === 1 && (
                <>
                    {React.createElement(StockSearchPane, searchPaneProps(p))}
                    {renderSearchPane()}
                </>
            )}
            {p.showEditPane === 0 && (
                <>
                    {renderStockData()}
                </>
            )}
        </div>
    )
}

export default forwardRef(PriceTargetBody)

export function priceTargetProps(that, key = "newWidgetNameProps") {
    let propList = {
        apiKey: that.props.apiKey,
        defaultExchange: that.props.defaultExchange,
        exchangeList: that.props.exchangeList,
        filters: that.props.widgetList[key]["filters"],
        trackedStocks: that.props.widgetList[key]["trackedStocks"],
        updateWidgetStockList: that.props.updateWidgetStockList,
        updateWidgetConfig: that.props.updateWidgetConfig,
        widgetKey: key,
        targetSecurity: that.props.targetSecurity,
    };
    return propList;
}


