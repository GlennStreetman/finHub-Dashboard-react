import React from "react";
import StockSearchPane from "../../../components/stockSearchPane.js";
import {finnHub} from "../../../appFunctions/throttleQueue.js";
// import Moment from "react-moment";

class NewsWidget extends React.Component {
  constructor(props) {
    super(props);

    let startList = this.props.trackedStocks.length > 0 ? this.props.trackedStocks : [];
    let startStock = startList.length > 0 ? startList[0] : undefined;
    this.state = {
      companyNews: [],
      // startDate: new Date(Date.now()-604800*1000).toISOString().slice(0, 10),
      // endDate: new Date().toISOString().slice(0, 10),
      newsSelection: startStock,
      newsIncrementor: 1,
    };
    this.getCompanyNews = this.getCompanyNews.bind(this);
    this.updateFilter = this.updateFilter.bind(this);
    this.updateWidgetList = this.updateWidgetList.bind(this);
    this.editNewsListForm = this.editNewsListForm.bind(this);
    this.displayNews = this.displayNews.bind(this);
    this.changeNewsSelection = this.changeNewsSelection.bind(this);
    this.newsTable = this.newsTable.bind(this);
    this.changeIncrememnt = this.changeIncrememnt.bind(this);
    this.formatSourceName = this.formatSourceName.bind(this);
    this.shortHeadline = this.shortHeadline.bind(this);
  }

  componentDidMount() {
    const p = this.props
    const s = this.state
    if (p.filters['startDate'] === undefined) {
      const startDate = new Date(Date.now()-604800*1000).toISOString().slice(0, 10)
      const endDate = new Date().toISOString().slice(0, 10)
      p.updateWidgetFilters(p.widgetKey, 'startDate', startDate)
      p.updateWidgetFilters(p.widgetKey, 'endDate', endDate)
    } 

    if (p.trackedStocks.length > 0 && s.newsSelection !== undefined && p.filters !== undefined) {
      this.getCompanyNews(s.newsSelection, p.filters.startDate, p.filters.endDate);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const p = this.props
    const s = this.state

    if (s.newsSelection !== prevState.newsSelection || p.showEditPane !== prevProps.showEditPane) {
      this.getCompanyNews(s.newsSelection, p.filters.startDate, p.filters.endDate);
    }
    if (this.state.newsSelection === 1 && this.props.trackedStocks.length) {
      this.setState({ newsSelection: this.props.trackedStocks[0] });
    }
  }

  formatSourceName(source) {
    //clean up source names for news articles.
    let formattedSource = source;
    formattedSource = formattedSource.replace(".com", "");
    formattedSource = formattedSource.replace("http:", "");
    formattedSource = formattedSource.replace("https:", "");
    formattedSource = formattedSource.replace("//", "");
    formattedSource = formattedSource.replace("www.", "");
    formattedSource = formattedSource.replace("wsj", "Wall Street Journal");
    formattedSource = formattedSource.replace(formattedSource[0], formattedSource[0].toUpperCase());

    return formattedSource;
  }

  shortHeadline(headline) {
    let shortHeadLine = headline.slice(0, 48) + "...";
    return shortHeadLine;
  }
  
  getCompanyNews(symbol, fromDate, toDate) {
    if (this.props.apiKey !== '' && symbol !== undefined) {
      let stockSymbol = symbol.slice(symbol.indexOf('-')+1, symbol.length)
      let that = this
      let querryString = "https://finnhub.io/api/v1/company-news?symbol=" + stockSymbol + "&from=" + fromDate + "&to=" + toDate + "&token=" + that.props.apiKey
      
      finnHub(this.props.throttle, querryString)
        // .then((data) => {console.log(data)})
        .then((data) => {
          let filteredNews = [];
          let newsCount = 0;
          for (var news in data) {
            if (data[news]["source"] !== "seekingalpha.com" && newsCount < 100) {
              filteredNews.push(data[news]);
              newsCount += 1;
            }
          }
          try {
            that.setState({ companyNews: filteredNews });
          } catch (err) {
            console.log("Could not update news.");
          }
        })
        .catch(error => {
          console.log(error.message)
        });
      // })
    }
  }

  changeIncrememnt(e) {
    const newIncrement = this.state.newsIncrementor + e;
    if (newIncrement > 0 && newIncrement < 11) this.setState({ newsIncrementor: newIncrement });
  }

  updateFilter(e) {
    const target = e.target;
    const name = target.name;
    this.props.updateWidgetFilters(this.props.widgetKey, name, target.value)
    // this.setState({ [name]: e.target.value });
  }

  changeNewsSelection(e) {
    const target = e.target.value;
    this.setState({ newsSelection: target });
    this.getCompanyNews(target, this.props.filters.startDate, this.props.filters.endDate);
    this.setState({ newsIncrementor: 1 });
  }

  updateWidgetList(stock) {
    if (stock.indexOf(":") > 0) {
      const stockSymbole = stock.slice(0, stock.indexOf(":"));
      this.props.updateWidgetStockList(this.props.widgetKey, stockSymbole);
    } else {
      this.props.updateWidgetStockList(this.props.widgetKey, stock);
    }
  }

  editNewsListForm() {
    let newsList = this.props.trackedStocks;

    let stockNewsRow = newsList.map((el) =>
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
    let stockNewsTable = (
      <table>
        <tbody>{stockNewsRow}</tbody>
      </table>
    );
    return stockNewsTable;
  }

  newsTable() {
    let increment = 10 * this.state.newsIncrementor;
    let newStart = increment - 10;
    let newsEnd = increment;
    let newsSlice = this.state.companyNews.slice(newStart, newsEnd);
    let mapNews = newsSlice.map((el, index) => (
      <tr key={el + "newsRow" + index}>
        <td key={el + "newsSource"}>{this.formatSourceName(el["source"])}</td>
        <td key={el + "newsHeadline"}>
          <a key={el + "newsUrl"} href={el["url"]} target="_blank" rel="noopener noreferrer">
            {this.shortHeadline(el["headline"])}
          </a>
        </td>
      </tr>
    ));

    let thisnewsTable = (
      <div className="newsBody">
        <table>
          <thead>
            <tr>
              <td>Source</td>
              <td>Headline</td>
            </tr>
          </thead>
          <tbody>{mapNews}</tbody>
        </table>
      </div>
    );
    return thisnewsTable;
  }

  displayNews() {
    let newSymbolList = this.props.trackedStocks.map((el) => (
      <option key={el + "ddl"} value={el}>
        {el}
      </option>
    ));

    let symbolSelectorDropDown = (
      <>
        <div>
          <select value={this.state.newsSelection} onChange={this.changeNewsSelection}>
            {newSymbolList}
          </select>
          <button onClick={() => this.changeIncrememnt(-1)}>
            <i className="fa fa-backward" aria-hidden="true"></i>
          </button>
          <button onClick={() => this.changeIncrememnt(1)}>
            <i className="fa fa-forward" aria-hidden="true"></i>
          </button>
        </div>
        <div>{this.newsTable()}</div>
      </>
    );
    return symbolSelectorDropDown;
  }

  render() {
    return (
      <>
        {this.props.showEditPane === 1 && (
          <>
            <div>
              <StockSearchPane
                apiKey={this.props.apiKey}
                // getStockPrice={this.props.getStockPrice}
                throttle={this.props.throttle}
                showSearchPane={() => this.props.showPane("showEditPane", 1)}
                updateGlobalStockList={this.props.updateGlobalStockList}
                updateWidgetStockList={this.props.updateWidgetStockList}
                widgetKey={this.props.widgetKey}     
              />
              <div className="stockSearch">
                <form className="form-inline">
                  <label htmlFor="start">Start date:</label>
                  <input className="btn" id="start" type="date" name="startDate" onChange={this.updateFilter} value={this.props.filters.startDate}></input>
                  <label htmlFor="end">End date:</label>
                  <input className="btn" id="end" type="date" name="endDate" onChange={this.updateFilter} value={this.props.filters.endDate}></input>
                </form>
              </div>
            </div>
            <div>{Object.keys(this.props.trackedStocks).length > 0 ? this.editNewsListForm() : <></>}</div>
          </>
        )}

        {this.props.showEditPane === 0 && <div>{Object.keys(this.props.trackedStocks).length > 0 ? this.displayNews() : <></>}</div>}
      </>
    );
  }
}

export function newsWidgetProps(that, key = "CandleWidget") {
  let propList = {
    apiKey: that.props.apiKey,
    filters: that.props.widgetList[key]["filters"],
    showPane: that.showPane,
    throttle: that.props.throttle,
    trackedStocks: that.props.widgetList[key]["trackedStocks"],
    updateGlobalStockList: that.props.updateGlobalStockList,
    updateWidgetFilters: that.props.updateWidgetFilters,
    updateWidgetStockList: that.props.updateWidgetStockList,
    widgetKey: key,

  };
  return propList;
}

export default NewsWidget;