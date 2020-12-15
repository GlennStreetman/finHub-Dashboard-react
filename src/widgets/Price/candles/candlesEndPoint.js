module.exports = function candleWidgetEndPoint(stockList, filters, apiKey){
    //filters should be: start, end, resolution
    // const e = filters.endDate
    // const s = filters.startDate
    // const startDateUnix = new Date(s.slice(0, 4), s.slice(5, 7), s.slice(8, 10)).getTime() / 1000;
    // const endDateUnix = new Date(e.slice(0, 4), e.slice(5, 7), e.slice(8, 10)).getTime() / 1000;
    const now = Date.now()
    const startUnixOffset = filters.startDate !== undefined ? filters.startDate : 604800
    const startUnix = Math.floor((now - startUnixOffset) / 1000)
    const endUnixOffset = filters.startDate !== undefined ? filters.endDate : 0
    const endUnix = Math.floor((now - endUnixOffset) / 1000)

    const resolution = filters.resolution
    let queryStringObj = {}
  
    for (const stock in stockList) {
      let stockSymbole = stockList[stock].slice(stockList[stock].indexOf('-')+1 , stockList[stock].length)
      const queryString = "https://finnhub.io/api/v1/stock/candle?symbol=" +
        stockSymbole +
        "&resolution=" +
        resolution +
        "&from=" +
        startUnix +
        "&to=" +
        endUnix +
        "&token=" + apiKey
  
        queryStringObj[stockSymbole] = (queryString)
      }
      return queryStringObj
  }