import './App.css';

import React from 'react';

import {Line} from 'react-chartjs-2';

function average(data){
  var sum = data.reduce(function(sum, value){
    return sum + value;
  }, 0);

  var avg = sum / data.length;
  return avg;
}

function standardDeviation(values){
  var avg = average(values);
  
  var squareDiffs = values.map(function(value){
    var diff = value - avg;
    var sqrDiff = diff * diff;
    return sqrDiff;
  });
  
  var avgSquareDiff = average(squareDiffs);

  var stdDev = Math.sqrt(avgSquareDiff);
  return stdDev / avg;
}

function getVolatility(series) {
    let seriesSorted = series.sort((a, b) => a.x - b.x);

    return seriesSorted.map((e, i) => {
      let dataSet = seriesSorted.slice(i - 30, i + 1).map(e => e.y);
      let stdDev = standardDeviation(dataSet);

      return {
          x: e.x,
          y: stdDev
      }
    });
  }

class App extends React.Component {
  constructor() {    
    super();

    this.state = {
      priceData: {},
      volatilityData: {}
    }

    this.chartOptions = {
        title: {
          display: true,
          text: 'Price',
          fontSize: 20
        },
        legend: {
          display: true,
          position: 'right'
        },
        scales: {
            xAxes: [{
                type: 'time',
                time: {
                    unit: 'month'
                }
            }]
        }
      };

      this.volatilityOptions = {
        title: {
          display: true,
          text: 'Volatility',
          fontSize: 20
        },
        legend: {
          display: true,
          position: 'right'
        },
        scales: {
            xAxes: [{
                type: 'time',
                time: {
                    unit: 'month'
                }
            }]
        }
      };

    this.startDate = new Date();
    this.startDate.setFullYear(this.startDate.getFullYear() - 1);

    this.endDate = new Date();
  }

  requestBTCData() {
      let url = process.env.PUBLIC_URL + '/data/raw/BTC_raw.json';

    return fetch(url)
      .then(res => (res.ok ? res : Promise.reject(res)))
      .then(res => res.json())
      .then(data => {
          let d = Object.entries(data.data.bpi).map((e) => {
              return {
                  x: new Date(e[0]),
                  y: Number(e[1])
              }
          });

          return {
            label: 'BTC',
            series: d,
            backgroundColor: 'gold',
            borderColor: 'gold'
          }
      });
  }

  requestStockData(symbol, color) {
    const url = process.env.PUBLIC_URL + `/data/raw/${symbol}_raw.json`;

    return fetch(url)
      .then(res => res.ok ? res : Promise.reject(res))
      .then(res => res.json())
      .then((raw) => {
          console.log(raw);

          let series = raw.data['Time Series (Daily)'];

          let keys = Object.keys(series).filter((key) => {
              let date = new Date(key);
              return date <= this.endDate && date >= this.startDate;
          }).sort((a, b) => new Date(a) - new Date(b));

          let splitCoeff = 1;
          let data = keys.reduce((d, key) => {
              let close = Number(series[key]['4. close']);
              let sf = Number(series[key]['8. split coefficient']);

              splitCoeff = splitCoeff * sf;
              if (sf > 1) {
                console.log(splitCoeff);
              }

              d.push({
                  x: new Date(key),
                  y: close * splitCoeff
              });

              return d;
          }, []);

          return {
              label: symbol,
              series: data,
              backgroundColor: color,
              borderColor: color
          }
      });
  }

  componentDidMount() {
    let dataTasks = [
        this.requestBTCData(), 
        this.requestStockData('AMZN', 'yellow'),
        this.requestStockData('GOOGL', 'green'),
        this.requestStockData('GLD', 'brown'),
        this.requestStockData('SLV', 'silver'),
        this.requestStockData('TSLA', 'black'),
        this.requestStockData('AAPL', 'purple'),
    ];

    Promise.all(dataTasks)
      .then((dataArr) => {
          console.log(dataArr);
        this.setState({
          // Prices
          priceData: {
            datasets: dataArr.map((data) => {
              return {
                  label: data.label,
                  fill: false,
                  lineTension: 0.5,
                  backgroundColor: data.backgroundColor,
                  borderColor: data.borderColor,
                  borderWidth: 2,
                  data: data.series
              };
            })
          },

          // Volatility
          volatilityData: {
              datasets: dataArr.map((data) => {
                  return {
                      label: data.label,
                      fill:false,
                      backgroundColor: data.backgroundColor,
                      borderColor: data.borderColor,
                      borderWidth: 2,
                      data: getVolatility(data.series)
                  }
              })
          }
        });
      });
  }

  render() {
    return (
      <div className="App">
        <Line data={this.state.priceData} options={this.chartOptions}/>
        <Line data={this.state.volatilityData} options={this.volatilityOptions}/>
      </div>
    );
  }
}

export default App;
