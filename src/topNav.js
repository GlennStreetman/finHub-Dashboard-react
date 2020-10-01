import React from "react";
import WidgetControl from "./widgets/widgetControl.js";
import { dashBoardMenuProps } from "./widgets/dashBoardMenu/dashBoardMenu.js";
import { watchListMenuProps } from "./widgets/watchListMenu/watchListMenu.js";
import { candleWidgetProps } from "./widgets/candle/candleWidget.js";
import { newsWidgetProps } from "./widgets/News/newsWidget.js";
import { stockDetailWidgetProps } from "./widgets/stockDetails/stockDetailWidget.js";

class TopNav extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      trackedStockData: {},
      widgetLockDown: 0, //1: Hide buttons, 0: Show buttons
      DashBoardMenu: 0, //1 = show, 0 = hide
      WatchListMenu: 0, //1 = show, 0 = hide
      loadStartingDashBoard: 0, //flag switches to 1 after attemping to load default dashboard.
    };

    this.showPane = this.showPane.bind(this);
    this.getStockPrice = this.getStockPrice.bind(this);
    this.updateTickerSockets = this.updateTickerSockets.bind(this);
    this.menuWidgetToggle = this.menuWidgetToggle.bind(this);
    this.returnBodyProps = this.returnBodyProps.bind(this);
  }

  returnBodyProps(that, key, ref = "pass") {
    // console.log(key);
    let widgetBodyProps = {
      WatchListMenu: () => watchListMenuProps(that, key),
      DashBoardMenu: () => dashBoardMenuProps(that, key),
      CandleWidget: () => candleWidgetProps(that, ref),
      NewsWidget: () => newsWidgetProps(that, ref),
      StockDetailWidget: () => stockDetailWidgetProps(that, ref),
    };
    let renderBodyProps = widgetBodyProps[key];
    // console.log(renderBodyProps);
    return renderBodyProps;
  }

  componentDidMount() {
    this.props.getSavedDashBoards();
  }

  componentDidUpdate() {
    if (this.props.refreshStockData === 1) {
      this.props.toggleRefreshStockData();

      for (const stock in this.props.globalStockList) {
        this.getStockPrice(this.props.globalStockList[stock]);
      }
    }

    if (this.state.loadStartingDashBoard === 0 && this.props.currentDashBoard !== "") {
      this.setState({ loadStartingDashBoard: 1 });
      try {
        let loadWidget = this.props.dashBoardData[this.props.currentDashBoard]["widgetList"];
        let loadGlobal = this.props.dashBoardData[this.props.currentDashBoard]["globalStockList"];
        this.props.loadDashBoard(loadGlobal, loadWidget);
        this.setState({ DashBoardMenu: 1 });
      } catch (err) {
        // console.log("failed to load dashboards");
      }
    }
  }

  updateTickerSockets() {
    //opens a series of socket connections to live stream stock prices
    const self = this;
    const globalStockList = this.props.globalStockList;
    const socket = new WebSocket("wss://ws.finnhub.io?token=" + this.props.apiKey);

    socket.addEventListener("open", function (event) {
      globalStockList.map((el) => socket.send(JSON.stringify({ type: "subscribe", symbol: el })));
    });

    // Listen for messages
    socket.addEventListener("message", function (event) {
      var tickerReponse = JSON.parse(event.data);
      // console.log("Message from server ", event.data);
      if (tickerReponse.data) {
        self.setState((prevState) => {
          let stockTickData = Object.assign({}, prevState.trackedStockData);
          let stockSymbol = tickerReponse.data[0]["s"];
          stockTickData[stockSymbol]["currentPrice"] = tickerReponse.data[0]["p"];
          return { trackedStockData: stockTickData };
        });
      }
    });
  }

  showPane(stateRef, fixState = 0) {
    //toggles view of specified menu. 1 = open 0 = closed
    let showMenu = this.state[stateRef] === 0 ? 1 : 0;
    fixState === 1 && (showMenu = 1);
    this.setState({ [stateRef]: showMenu });
  }

  getStockPrice(stockDescription) {
    const stockSymbol = stockDescription.indexOf(":") > 0 ? stockDescription.slice(0, stockDescription.indexOf(":")) : stockDescription;
    let stockPriceData = {};
    fetch("https://finnhub.io/api/v1/quote?symbol=" + stockSymbol + "&token=" + this.props.apiKey)
      .then((response) => response.json())
      .then((data) => {
        //destructure data returned from fetch.
        const {
          c: a, //current price
          h: b, //current days high price
          l: c, //current days low price
          o: d, //current days open price
          pc: e, //previous days close price
        } = data;
        //create object from destructured data above.
        stockPriceData = {
          currentPrice: a,
          dayHighPrice: b,
          dayLowPrice: c,
          dayOpenPrice: d,
          prevClosePrice: e,
        };

        this.setState((prevState) => {
          let newTrackedStockData = Object.assign({}, prevState.trackedStockData);
          newTrackedStockData[stockSymbol] = stockPriceData;
          return { trackedStockData: newTrackedStockData };
        });
      })
      .then(() => {
        // console.log("done");
        this.updateTickerSockets();
      });
    // return stockPriceData
  }

  menuWidgetToggle(menuName, dashName = "pass") {
    //Create dashboard menu if first time looking at, else toggle visability

    if (this.props.menuList[menuName] === undefined) {
      this.props.newMenuContainer(menuName, dashName, "menuWidget");
      this.setState({ [menuName]: 1 });
    } else {
      this.state[menuName] === 1 ? this.setState({ [menuName]: 0 }) : this.setState({ [menuName]: 1 });
    }
  }

  render() {
    let widgetState = this.props.widgetList;
    let menuState = this.props.menuList;
    let that = this;

    let widgetRender = Object.keys(widgetState).map((el) => (
      <WidgetControl
        //Required for widget Control.
        key={el}
        moveWidget={this.props.moveWidget}
        removeWidget={this.props.removeWidget}
        stateRef="widgetList" //used by app.js to move and remove widgets.
        widgetBodyProps={this.returnBodyProps(that, widgetState[el]["widgetType"], el)}
        widgetKey={el}
        widgetList={widgetState[el]}
        widgetLockDown={this.state.widgetLockDown}
        //remove below?
        // globalStockList={this.props.globalStockList}
        // updateGlobalStockList={this.props.updateGlobalStockList}
        // getStockPrice={this.getStockPrice}
        // trackedStockData={this.state.trackedStockData}
        // apiKey={this.props.apiKey}
        // updateWidgetStockList={this.props.updateWidgetStockList}
        // loadDashBoard={this.props.loadDashBoard}
        // saveCurrentDashboard={this.props.saveCurrentDashboard}
        // getSavedDashBoards={this.props.getSavedDashBoards}
        // currentDashBoard={this.props.currentDashBoard}
      />
    ));

    let menuRender = Object.keys(menuState).map((el) => (
      <WidgetControl
        key={el}
        menuWidgetToggle={this.menuWidgetToggle}
        moveWidget={this.props.moveWidget}
        removeWidget={this.props.removeWidget}
        stateRef="menuList" //used by app.js to move and remove widgets.
        showMenu={this.state[el]}
        widgetBodyProps={this.returnBodyProps(that, el)}
        widgetKey={el}
        widgetList={menuState[el]}
        widgetLockDown={this.state.widgetLockDown}
      />
    ));

    return (
      <>
        <div className="topnav">
          <a href="#home">About</a>

          <div>
            <a href="#contact" onClick={() => this.menuWidgetToggle("WatchListMenu", "WatchList")}>
              {this.state.WatchListMenu === 0 ? "Show Watchlist Menu" : "Hide Watchlist Menu"}
            </a>
          </div>

          <div>
            <a href="#contact" onClick={() => this.menuWidgetToggle("DashBoardMenu", "Saved Dashboards")}>
              {/* <a href="#contact" onClick={() => this.showPane("showDashBoardMenu")}> */}
              {this.state.DashBoardMenu === 0 ? "Show Dashboard Menu" : "Hide Dashboard Menu"}
            </a>
          </div>
          <div>
            <a href="#contact" onClick={() => (this.state.widgetLockDown === 0 ? this.setState({ widgetLockDown: 1 }) : this.setState({ widgetLockDown: 0 }))}>
              {this.state.widgetLockDown === 0 ? "Lock Widgets" : "Unlock Widgets"}
            </a>
          </div>
          <div className="dropDiv" onMouseLeave={() => this.showPane("showAddWidgetDropdown")}>
            <a href="#test" className="dropbtn" onMouseOver={() => this.showPane("showAddWidgetDropdown")}>
              Add Widget
            </a>
            {this.state.showAddWidgetDropdown === 1 && (
              <div className="dropdown">
                <div className="dropdown-content">
                  <a
                    href="#1"
                    onClick={() => {
                      this.props.newWidgetContainer("StockDetailWidget", "Stock Values: ", "stockWidget");
                    }}
                  >
                    Day Stock Price
                  </a>
                  <a
                    href="#2"
                    onClick={() => {
                      this.props.newWidgetContainer("NewsWidget", "Recent News: ", "stockWidget");
                    }}
                  >
                    News Widget
                  </a>
                  <a
                    href="#3"
                    onClick={() => {
                      this.props.newWidgetContainer("CandleWidget", "Candle Data: ", "stockWidget");
                    }}
                  >
                    Stock Candles
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {widgetRender}
        {menuRender}
      </>
    );
  }
}

export default TopNav;

//removed from menuProps
// getStockPrice={this.getStockPrice}
//required for widget body.
//remove below
// apiKey={this.props.apiKey}
// currentDashBoard={this.props.currentDashBoard}
// dashBoardData={this.props.dashBoardData}
// globalStockList={this.props.globalStockList}
// getSavedDashBoards={this.props.getSavedDashBoards}
// loadDashBoard={this.props.loadDashBoard}
// saveCurrentDashboard={this.props.saveCurrentDashboard}
// trackedStockData={this.state.trackedStockData}
// updateGlobalStockList={this.props.updateGlobalStockList}
// updateWidgetStockList={this.props.updateWidgetStockList}
