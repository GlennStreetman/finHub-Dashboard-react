import React from "react";
import StockSearchPane from "../../../components/stockSearchPane.js";
import CreateCandleStickChart from "./createCandleStickChart.js";
import {finnHub} from "../../../appFunctions/throttleQueue.js";
// import { json } from "body-parser";

export default class Candles extends React.Component {
  constructor(props) {
    super(props);
    let p = this.props.trackedStocks
    let startString = p.length > 0 && p[0].slice(p[0].indexOf('-') + 1, p[0].length)
    let startStock = this.props.trackedStocks.length > 0 ? startString : '';

    this.state = {
      // startDate: new Date(Date.now()-31536000*1000).toISOString().slice(0, 10), 
      // endDate: new Date().toISOString().slice(0, 10), //default to today.
      candleSelection: startStock, //current stock to be graphed.
      candleData: { 0: "blank" }, //graph data.
      chartData: [],
      options: {}, //graph options
      // resolution: "W",
      selectResolution: [1, 5, 15, 30, 60, "D", "W", "M"],
    };
    this.baseState = {mounted: true}
    this.updateWidgetList = this.updateWidgetList.bind(this);
    this.updateFilter = this.updateFilter.bind(this);
    this.getCandleData = this.getCandleData.bind(this);
    this.editCandleListForm = this.editCandleListForm.bind(this);
    this.displayCandleGraph = this.displayCandleGraph.bind(this);
    this.changeStockSelection = this.changeStockSelection.bind(this);
    this.createCandleDataList = this.createCandleDataList.bind(this);
    this.createChartOptions = this.createChartOptions.bind(this);
  }

  componentDidMount() {
    const p = this.props
    if (p.filters['startDate'] === undefined) {
      const startDateSetBack = 31536000*1000 //1 week
      const endDateSetBack = 0
      p.updateWidgetFilters(p.widgetKey, 'startDate', startDateSetBack)
      p.updateWidgetFilters(p.widgetKey, 'endDate', endDateSetBack)
      p.updateWidgetFilters(p.widgetKey, 'Description', 'Date numbers are millisecond offset from now. Used for Unix timestamp calculations.')
      p.updateWidgetFilters(p.widgetKey, 'resolution', 'W')
    } 
    
    
    if (p.trackedStocks.length > 0) {
      this.getCandleData();
    }
  }

  componentWillUnmount(){
    this.baseState.mounted = false
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.candleSelection !== prevState.candleSelection || 
        this.props.showEditPane !== prevProps.showEditPane) {
      this.getCandleData();
    }
    if (this.state.candleSelection === '' && this.props.trackedStocks.length) {
      this.setState({ candleSelection: this.props.trackedStocks[0] });
    }
  }

  updateWidgetList(stock) {
    if (stock.indexOf(":") > 0) {
      const stockSymbole = stock.slice(0, stock.indexOf(":"));
      this.props.updateWidgetStockList(this.props.widgetKey, stockSymbole);
    } else {
      this.props.updateWidgetStockList(this.props.widgetKey, stock);
    }
  }

  updateFilter(e) {
    // const target = e.target;
    // const name = target.name;
    if (isNaN(new Date(e.target.value).getTime()) === false){
      const now = Date.now()
      const target = new Date(e.target.value).getTime();
      const offset = now - target
      const name = e.target.name;
      this.props.updateWidgetFilters(this.props.widgetKey, name, offset);
    };
  }

  getCandleData() {
    // console.log('creating candle chart')
    const p = this.props
    if (p.apiKey !== '') {
      const candleStock = this.state.candleSelection
      const candleSymbol = candleStock.slice(candleStock.indexOf('-')+1 , candleStock.length)
      const now = Date.now()
      const startUnixOffset = p.filters.startDate !== undefined ? p.filters.startDate : 604800
      const startUnix = Math.floor((now - startUnixOffset) / 1000)
      const endUnixOffset = p.filters.startDate !== undefined ? p.filters.endDate : 0
      const endUnix = Math.floor((now - endUnixOffset) / 1000)

      let that =  this
      const queryString = "https://finnhub.io/api/v1/stock/candle?symbol=" +
          candleSymbol +
          "&resolution=" +
          p.filters.resolution +
          "&from=" +
          startUnix +
          "&to=" +
          endUnix +
          "&token=" + that.props.apiKey

      console.log(queryString)

      finnHub(this.props.throttle, queryString)
      .then((data) => {
          // try {
          if (this.baseState.mounted === true) {
            that.setState({ candleData: data });
            that.createCandleDataList(data);
          }
          // } catch (err) {
          //   console.log("Could not update candles. Component not mounted.");
          // }
        })
        .catch(error => {
          console.log(error.message)
        });
    }
  }

  createCandleDataList(data) {
    if (data["s"] !== "no_data") {
      let nodeCount = data["c"].length;
      // this.setState({ showChart: 0 });
      this.setState({ chartData: [] });
      for (let nodei = 0; nodei < nodeCount; nodei++) {
        let newNode = {
          x: new Date(data["t"][nodei] * 1000),
          y: [data["o"][nodei], data["h"][nodei], data["l"][nodei], data["c"][nodei]], //open, high, low, close
        };
        let updateChartData = this.state.chartData.slice();
        updateChartData.push(newNode);
        this.setState({ chartData: updateChartData });
      }
      this.createChartOptions();
    }
  }

  createChartOptions() {
    const p = this.props
    
    const now = Date.now()
    const startUnixOffset = p.filters.startDate !== undefined ? p.filters.startDate : 604800*1000
    const startUnix = now - startUnixOffset
    const endUnixOffset = p.filters.startDate !== undefined ? p.filters.endDate : 0
    const endUnix = now - endUnixOffset
    const startDate = new Date(startUnix).toISOString().slice(0, 10);
    const endDate = new Date(endUnix).toISOString().slice(0, 10);
    
    const options = {
      theme: "light2", // "light1", "light2", "dark1", "dark2"
      animationEnabled: true,
      exportEnabled: false,
      height: 400,
      width: 525,
      title: {
        text: this.state.candleSelection + ": " + startDate + " - " + endDate,
      },
      axisX: {
        valueFormatString: "YYYY-MM-DD",
      },
      axisY: {
        prefix: "$",
        title: "Price (in USD)",
      },
      data: [
        {
          type: "candlestick",
          showInLegend: true,
          name: this.state.candleSelection,
          yValueFormatString: "$###0.00",
          xValueFormatString: "YYYY-MM-DD",
          dataPoints: this.state.chartData,
        },
      ],
    };
    this.setState({ options: options });

    // this.setState({ showChart: 1 });
  }

  changeStockSelection(e) {
    const target = e.target.value;
    this.setState({ candleSelection: target });
  }

  editCandleListForm() {
    let candleList = this.props.trackedStocks;

    let candleSelectionRow = candleList.map((el) =>
      this.props.showEditPane === 1 ? (
        <tr key={el + "container"}>
          <td key={el + "name"}>{el}</td>
          <td key={el + "buttonC"}>
            <button
              key={el + "button"}
              onClick={() => {
                this.updateWidgetList(el);
              }}
            >
              <i className="fa fa-times" aria-hidden="true" key={el + "icon"}></i>
            </button>
          </td>
        </tr>
      ) : (
        <tr key={el + "pass"}></tr>
      )
    );
    let stockCandleTable = (
      <table>
        <tbody>{candleSelectionRow}</tbody>
      </table>
    );
    return stockCandleTable;
  }

  displayCandleGraph() {
    let newSymbolList = this.props.trackedStocks.map((el) => (
      <option key={el + "ddl"} value={el}>
        {el}
      </option>
    ));

    let symbolSelectorDropDown = (
      <>
        <div className="div-inline">
          {"  Selection:  "}
          <select className="btn" value={this.state.candleSelection} onChange={this.changeStockSelection}>
            {newSymbolList}
          </select>
        </div>
        <div className="graphDiv">
          <CreateCandleStickChart candleData={this.state.options} candleSelection={this.state.candleSelection} />
        </div>
      </>
    );
    return symbolSelectorDropDown;
  }

  render() {
    let resolutionList = this.state.selectResolution.map((el) => (
      <option key={el + "rsl"} value={el}>
        {el}
      </option>
    ));

    const p = this.props
    
    const now = Date.now()
    const startUnixOffset = p.filters.startDate !== undefined ? p.filters.startDate : 604800*1000
    const startUnix = now - startUnixOffset
    const endUnixOffset = p.filters.startDate !== undefined ? p.filters.endDate : 0
    const endUnix = now - endUnixOffset
    const startDate = new Date(startUnix).toISOString().slice(0, 10);
    const endDate = new Date(endUnix).toISOString().slice(0, 10);

    return (
      <>
        {this.props.showEditPane === 1 && (
          <>
            <div className="searchPane">
              <StockSearchPane
                updateWidgetStockList={this.props.updateWidgetStockList}
                widgetKey={this.props.widgetKey}
                updateGlobalStockList={this.props.updateGlobalStockList}
                showSearchPane={() => this.props.showPane("showEditPane", 1)}
                // getStockPrice={this.props.getStockPrice}
                apiKey={this.props.apiKey}
                throttle={this.props.throttle}
              />
              <div className="stockSearch">
                <form className="form-inline">
                  <label htmlFor="start">Start date:</label>
                  <input className="btn" id="start" type="date" name="startDate" onChange={this.updateFilter} value={startDate}></input>
                  <label htmlFor="end">End date:</label>
                  <input className="btn" id="end" type="date" name="endDate" onChange={this.updateFilter} value={endDate}></input>
                  <label htmlFor="resBtn">Resolution:</label>
                  <select id="resBtn" className="btn" name='resolution' value={this.props.filters.resolution} onChange={this.updateFilter}>
                    {resolutionList}
                  </select>
                </form>
              </div>
            </div>
            <div>{Object.keys(this.props.trackedStocks).length > 0 ? this.editCandleListForm() : <></>}</div>
          </>
        )}
        {this.props.showEditPane === 0 && (
          <div className="graphDiv">{Object.keys(this.props.trackedStocks).length > 0 ? this.displayCandleGraph() : <></>}</div>
        )}
      </>
    );
  }
}

export function candleWidgetProps(that, key = "Candles") {
  let propList = {
    apiKey: that.props.apiKey,
    filters: that.props.widgetList[key]["filters"],
    showPane: that.showPane,
    trackedStocks: that.props.widgetList[key]["trackedStocks"],
    updateGlobalStockList: that.props.updateGlobalStockList,
    updateWidgetFilters: that.props.updateWidgetFilters,
    updateWidgetStockList: that.props.updateWidgetStockList,
    widgetKey: key,
    throttle: that.props.throttle,
  };
  return propList;
}


