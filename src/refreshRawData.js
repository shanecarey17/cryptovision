const fs = require('fs');
const fetch = require('node-fetch');

let startDate = new Date();
startDate.setHours(0, 0, 0, 0);
startDate.setFullYear(startDate.getFullYear() - 1);

let endDate = new Date();
endDate.setHours(0, 0, 0, 0);

function getFilename(tag) {
  return `public/data/raw/${tag}_raw.json`
}

function isUpdated(tag) {
  try {
    let data = JSON.parse(fs.readFileSync(getFilename(tag)));
    console.log(data.fetchedAt, endDate);
    return new Date(data.fetchedAt) >= endDate;
  } catch (err) {
    console.log(err);
    return false;
  }
}

function writeFile(data, tag) {
  fs.writeFileSync(getFilename(tag), JSON.stringify({
    data,
    fetchedAt: endDate.toISOString()
  }));
}

function requestBTCData() {
  if (isUpdated('BTC')) {
    console.log('BTC up to date');
    return;
  }

  console.log('Loading BTC');

  let startDateFmt = startDate.toISOString().substring(0, 10);
  let endDateFmt = endDate.toISOString().substring(0, 10);
  const coindeskUrl = `https://api.coindesk.com/v1/bpi/historical/close.json?start=${startDateFmt}&end=${endDateFmt}`;

  return fetch(coindeskUrl)
    .then(res => (res.ok ? res : Promise.reject(res)))
    .then(res => res.json())
    .then(data => {
        writeFile(data, 'BTC');
    });
  }

function requestStockData(symbol) {
  if (isUpdated(symbol)) {
    console.log(`${symbol} up to date`);
    return;
  }

  console.log(`Loading ${symbol}`);

  const apiKey = 'DUO7FCK83E64UX0R';

  const avUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&apikey=${apiKey}&outputsize=full`;

  return fetch(avUrl)
    .then(res => res.ok ? res : Promise.reject(res))
    .then(res => res.json())
    .then((data) => {
        writeFile(data, symbol);
    });
  }

requestBTCData();
requestStockData('AMZN');
requestStockData('GOOGL');
requestStockData('GLD');
requestStockData('SLV');
requestStockData('TSLA');
requestStockData('AAPL');
