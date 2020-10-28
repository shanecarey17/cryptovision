import './App.css';

import React from 'react';

import {Line} from 'react-chartjs-2';

class App extends React.Component {
  constructor() {    
    super();

    this.state = {
      chartData: {},
      chartOptions: {
        title: {
          display: true,
          text: 'BTC',
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
      }
    }

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
          let series = raw.data['Time Series (Daily)'];

          let keys = Object.keys(series).filter((key) => {
              let date = new Date(key);
              return date <= this.endDate && date >= this.startDate;
          }).sort((a, b) => +Date(b) - +Date(a));

          let data = keys.reduce((d, key) => {
              d.push({
                  x: new Date(key),
                  y: Number(series[key]['4. close'])
              });
              return d;
          }, []);

          return {
              label: symbol,
              series: data,
              backgroundColor: color,
              borderColor: color
          }
      })
  }

  componentDidMount() {
    let dataTasks = [
        this.requestBTCData(), 
        //this.requestStockData('AAPL', 'blue'), 
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
          chartData: {
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
          }
        });
      });
  }

  render() {
    return (
      <div className="App">
        <Line data={this.state.chartData} options={this.state.chartOptions}/>
      </div>
    );
  }
}

export default App;
