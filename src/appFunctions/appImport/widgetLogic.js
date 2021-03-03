export const NewMenuContainer = function newMenuContainer(widgetDescription, widgetHeader, widgetConfig) {
    const widgetName = widgetDescription;
    // this.updateZIndex(widgetName)
    let newMenuList = Object.assign({}, this.state.menuList);
    newMenuList[widgetName] = {
        column: 0,
        columnOrder: -1,
        widgetID: widgetName,
        widgetType: widgetDescription,
        widgetHeader: widgetHeader,
        xAxis: "5rem",
        yAxis: "5rem",
        widgetConfig: widgetConfig,
    };
    this.setState({ menuList: newMenuList });
}

export const NewWidgetContainer = function newWidgetContainer(widgetDescription, widgetHeader, widgetConfig) {
const widgetName = new Date().getTime();
// this.updateZIndex(widgetName)
let newWidgetList = Object.assign({}, this.state.widgetList);
newWidgetList[widgetName] = {
    column: 0,
    columnOrder: -1,
    widgetID: widgetName,
    widgetType: widgetDescription,
    widgetHeader: widgetHeader,
    xAxis: "5rem",
    yAxis: "5rem",
    trackedStocks: this.state.globalStockList,
    widgetConfig: widgetConfig,
    filters: {}
};
this.setState({ widgetList: newWidgetList }); 
}

export const ChangeWidgetName = function changeWidgetName(stateRef, widgetID, newName) {
    //stateref should equal widgetlist or menulist.
    // console.log(stateRef + ":" + widgetID + ":" + newName);
    let newWidgetList = Object.assign(this.state[stateRef]);
    newWidgetList[widgetID]["widgetHeader"] = newName;
    this.setState({ stateRef: newWidgetList });
}

export const LockWidgets = function lockWidgets(toggle){
    console.log("toggle widget lock")
    this.setState({widgetLockDown: toggle})
}

export const RemoveWidget = function removeWidget(stateRef, widgetID) {
    //stateref should be "widgetList" or "menuList"
    let newWidgetList = Object.assign(this.state[stateRef]);
    delete newWidgetList[widgetID];
    this.setState({ 
        stateRef: newWidgetList, 
        rebuildDataSet: 1,
    });
}

export const UpdateWidgetFilters = function updateWidgetFilters(widgetID, dataKey, data){
    const updatedWidgetList = {...this.state.widgetList}
    if (updatedWidgetList[widgetID].filters === undefined) {
        updatedWidgetList[widgetID].filters = {}
    }
    updatedWidgetList[widgetID].filters[dataKey] = data
    this.setState({
        widgetList: updatedWidgetList,
        rebuildDataSet: 1,
    })
}

export const UpdateWidgetStockList = function updateWidgetStockList(widgetId, symbol, stockObj={}) {
    //adds if not present, else removes stock from widget specific stock list.
    // console.log(widgetId, symbol, stockObj, 'updating stock list')
    if (isNaN(widgetId) === false) {
      let updateWidgetStockList = Object.assign({}, this.state.widgetList); //copy widget list
      const trackingSymbolList = Object.assign({}, updateWidgetStockList[widgetId]["trackedStocks"]); //copy target widgets stock object

        if (Object.keys(trackingSymbolList).indexOf(symbol) === -1) {
        //add
            trackingSymbolList[symbol] = {...stockObj}
            trackingSymbolList[symbol]['dStock'] = function(ex){
                if (ex.length === 1) {
                return (this.symbol)
                } else {
                return (this.key)
                }
            }
        updateWidgetStockList[widgetId]["trackedStocks"] = trackingSymbolList;


    } else {
        //remove
        delete trackingSymbolList[symbol]
        updateWidgetStockList[widgetId]["trackedStocks"] = trackingSymbolList
    }

      // updateWidgetStockList[widgetId]["trackedStocks"] = trackingSymbolList;
        this.setState({ 
            widgetList: updateWidgetStockList,
            rebuildDataSet: 1,
        });
    }
}

export const ToggleWidgetVisability = function toggleWidgetVisability(){
    const s = this.state
    this.setState({showStockWidgets: s.showStockWidgets === 0 ? 1 : 0})
}