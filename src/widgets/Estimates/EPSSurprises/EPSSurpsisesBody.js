import React, { Component } from 'react'
import StockSearchPane, {searchPaneProps} from "../../../components/stockSearchPane.js";
import {finnHub} from "../../../appFunctions/throttleQueue.js";
import {dStock, sStock} from "../../../appFunctions/formatStockSymbols.js";
import ReactChart from "./reactChart.js";

export default class EstimatesEPSSurprises extends Component {
  constructor(props) {
    super(props);
    this.state = {
      targetStock: '',
      stockData: undefined, //object
      chartOptions: undefined, //object defining chart options
    };

  this.baseState = {mounted: true}
  this.renderSearchPane = this.renderSearchPane.bind(this);
  this.renderStockData = this.renderStockData.bind(this);
  this.getStockData = this.getStockData.bind(this);
  this.updateFilter = this.updateFilter.bind(this);
  this.createChartDataList = this.createChartDataList.bind(this);
  this.createChartOptions = this.createChartOptions.bind(this);
  this.changeStockSelection = this.changeStockSelection.bind(this);
}

componentDidMount(){
  const p = this.props
  p.trackedStocks[0] !== undefined && this.setState({targetStock: p.trackedStocks[0]}, ()=>this.getStockData())
}

componentDidUpdate(prevProps, prevState){
  const p = this.props
  if (prevProps.trackedStocks[0] === undefined && p.trackedStocks[0] !== undefined) {
    this.setState({targetStock: p.trackedStocks[0]}, ()=>this.getStockData())
  }
}

componentWillUnmount(){
  this.baseState.mounted = false
}

updateFilter(e) {
  //e should be click event.
  this.props.updateWidgetFilters(this.props.widgetKey, "filterName", e)
}

renderSearchPane(){
  //add search pane rendering logic here. Additional filters need to be added below.
const p = this.props
const stockList = p.trackedStocks;
const stockListRows = stockList.map((el) =>
    <tr key={el + "container"}>
      <td key={el + "name"}>{dStock(el, p.exchangeList)}</td>
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
  )

let stockTable = (
  <table>
    <tbody>{stockListRows}</tbody>
  </table>
);
return stockTable
}

changeStockSelection(e) {
  const target = e.target.value;
  this.setState({ targetStock: target }, ()=>this.getStockData());
}

createChartDataList() {
  const s = this.state
  const actualList = []
  const estimateList = []

  for (const i in s.stockData) { 
    const n = s.stockData
    actualList.push({'x': new Date(n[i]['period']), 'y': n[i]['actual']})
    estimateList.push({'x': new Date(n[i]['period']), 'y': n[i]['estimate']  })
  }

  const newChartData = {
    actual: actualList, 
    estimate: estimateList,
  }

  this.createChartOptions(newChartData);
}

createChartOptions(chartData) {
  const options = {
    theme: "light2",
    animationEnabled: true,
    exportEnabled: true,
    title: {
      text: this.state.targetStock + ': EPS Surprises'
    },
    axisX: {
      title: ""
    },
    axisY: {
      title: "Quarterly EPS",
      suffix: ""
    },
    legend: {
      cursor: "pointer",
      itemclick: this.toggleDataSeries
    },
    data: [{
      type: "scatter",
      name: "Actual",
      markerType: "circle",
      showInLegend: true,
      // toolTipContent: "<span style=\"color:#4F81BC \">{name}</span><br>Active Users: {x}<br>CPU Utilization: {y}%",
      dataPoints: chartData.actual
    }, 
    {
      type: "scatter",
      name: "Estimate",
      markerType: "cross",
      showInLegend: true,
      // toolTipContent: "<span style=\"color:#4F81BC \">{name}</span><br>Active Users: {x}<br>CPU Utilization: {y}%",
      dataPoints: chartData.estimate
    }]
  }

  this.setState({ chartOptions: options });

}

getStockData(){
  const p = this.props
  const s = this.state
  const that = this
  const queryString = `https://finnhub.io/api/v1/stock/earnings?symbol=${sStock(s.targetStock)}&token=${p.apiKey}`
  finnHub(p.throttle, queryString)
  .then((data) => {
    if (that.baseState.mounted === true) {
      // console.log(queryString,data)
      this.setState({stockData: data}, ()=>this.createChartDataList())
    }
  })
  .catch(error => {
    console.log(error.message)
  });
}

renderStockData(){
  const s = this.state
  let newSymbolList = this.props.trackedStocks.map((el) => (
    <option key={el + "ddl"} value={el}>
      {dStock(el, this.props.exchangeList)}
    </option>
  ));

  let chartBody = (
    <>
      <div className="div-inline">
        {"  Selection:  "}
        <select className="btn" value={s.targetStock} onChange={this.changeStockSelection}>
          {newSymbolList}
        </select>
      </div>
      <div className="graphDiv">
        <ReactChart chartOptions={s.chartOptions} />
      </div>
    </>
  );
  return chartBody;
} 

render() {
    return (
        <>
        {this.props.showEditPane === 1 && (
          <>
          {React.createElement(StockSearchPane, searchPaneProps(this))}
          {this.renderSearchPane()}
          </>
        )}
        {Object.keys(this.props.trackedStocks).length > 0 && 
        this.props.showEditPane === 0  ? this.renderStockData() : <></>}       
      </>
    )
  }
}

export function EPSSurprisesProps(that, key = "newWidgetNameProps") {
    let propList = {
      apiKey: that.props.apiKey,
      showPane: that.showPane,
      trackedStocks: that.props.widgetList[key]["trackedStocks"],
      filters: that.props.widgetList[key]["filters"],
      updateWidgetFilters: that.props.updateWidgetFilters,
      updateGlobalStockList: that.props.updateGlobalStockList,
      updateWidgetStockList: that.props.updateWidgetStockList,
      widgetKey: key,
      throttle: that.props.throttle,
      exchangeList: that.props.exchangeList,
      defaultExchange: that.props.defaultExchange,
      updateDefaultExchange: that.props.updateDefaultExchange,
    };
    return propList;
  }


  // fetch('https://finnhub.io/api/v1/stock/earnings?symbol=AAPL&token=bsuu7qv48v6qu589jlj0')
  //   .then(response => response.json())
  //   .then(data => console.log(data))

  