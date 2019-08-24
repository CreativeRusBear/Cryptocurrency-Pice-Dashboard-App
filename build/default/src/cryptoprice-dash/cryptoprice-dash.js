import { PolymerElement, html } from "../../node_modules/@polymer/polymer/polymer-element.js";
import { afterNextRender } from "../../node_modules/@polymer/polymer/lib/utils/render-status.js";
import "../../node_modules/@polymer/iron-ajax/iron-ajax.js";
import "../../node_modules/@polymer/polymer/lib/elements/dom-repeat.js";
import "../../node_modules/@polymer/paper-spinner/paper-spinner-lite.js";
import "../../node_modules/@polymer/paper-button/paper-button.js";
import "../../node_modules/@polymer/paper-styles/typography.js";

class CryptopriceDash extends PolymerElement {
  static get template() {
    return html`
            <style>
                *{
                    font-family: 'Century Gothic',Century, Arial, sans-serif;
                }
                paper-spinner-lite{
                    width: 70px;
                    height: 70px;
                    display: block;
                    margin: 20px auto;
                }
                .container{
                    width: 80%;
                    margin: auto;
                    text-align: center;
                }
                #canvas_container{
                    width: 100%;
                    margin: 5vh auto;
                }
            </style>
            
            <iron-ajax 
                id="coinbase" 
                handle-as="json" 
                on-response="_handleResponse"
                loading="{{loading}}">
            </iron-ajax>
            <paper-spinner-lite active="[[loading]]"></paper-spinner-lite>
             <div class="container" hidden="[[loading]]">
                <h2>Cryptocurrency Price Dash</h2>
                <div>
                    <dom-repeat items="[[currencies]]">
                        <template>
                            <paper-button noink on-click="_getCurrencyHistoricData">[[item.name]] -  [[item.price]] RUB</paper-button>
                        </template>
                    </dom-repeat>
                </div>
                
                <div id="canvas_container">
                    <canvas id="canvas" width="5" height="3"></canvas>
                </div>
            </div>
            
        `;
  }

  static get properties() {
    return {
      currencies: {
        type: Array,
        value: [{
          code: 'BTC',
          name: 'Bitcoin',
          price: 0
        }, {
          code: 'ETH',
          name: 'Ethereum',
          price: 0
        }, {
          code: 'LTC',
          name: 'Litecoin',
          price: 0
        }]
      },
      loading: {
        type: Boolean,
        notify: true,
        value: false
      },
      lineChart: {}
    };
  }

  ready() {
    super.ready();
    afterNextRender(this, () => {
      this._getCurrencyData();

      this._getCurrencyHistoricData(this.currencies[0].code);
    });
  }

  _getCurrencyData() {
    const ajax = this.$.coinbase;
    const currencies = this.currencies;
    currencies.forEach(item => {
      ajax.url = `https://api.coinbase.com/v2/prices/${item.code}-RUB/spot`;
      ajax.generateRequest();
    });
  }

  _getCurrencyHistoricData(currency) {
    if (currency instanceof Event) currency = currency.model.item.code;
    const ajax = this.$.coinbase;
    ajax.url = `https://api.coinbase.com/v2/prices/${currency}-RUB/historic?period=month`;
    ajax.generateRequest();
  }

  _handleResponse(res) {
    if (res.detail.response.data.amount) this._computeCurrencyPrice(res.detail);else this._computeGraph(res.detail);
  }

  _computeCurrencyPrice(data) {
    let code = data.url.substring(35, 38);
    let index = this.currencies.map(item => item.code).indexOf(code);
    let cryptoPrice = Number(data.response.data.amount);
    this.set(`currencies.${index}.price`, cryptoPrice.toFixed(2));
  }

  _computeDateTime(datestring) {
    return datestring ? moment(datestring, 'YYYY-MM-DDThh:mm:aaZ').format('LLL') : datestring;
  }

  _computeGraph(data) {
    let code;
    this.currencies.forEach(item => {
      if (item.code == data.url.substring(35, 38)) {
        code = item.name;
      }
    });
    let labels = [];
    let prices = [];
    data.response.data.prices.forEach(item => {
      labels.push(this._computeDateTime(item.time));
      prices.push(item.price);
    });

    this._generateLineChart(labels, prices, code);
  }

  _generateLineChart(labels, prices, labelName) {
    if (this.lineChart) this.lineChart.destroy();
    var ctx = this.$.canvas.getContext('2d');
    this.lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels.reverse(),
        datasets: [{
          pointRadius: 0,
          label: labelName,
          backgroundColor: "rgba(111, 124, 186, 0.1)",
          borderColor: "rgba(111, 124, 186, 1)",
          borderWidth: 2,
          data: prices.reverse()
        }]
      },
      options: {
        responsive: true,
        animation: {
          duration: 1300,
          hover: {
            animationDuration: 0
          }
        },
        tooltips: {
          mode: 'index',
          intersect: false
        },
        scales: {
          xAxes: [{
            gridLines: {
              display: true
            }
          }],
          yAxes: [{
            gridLines: {
              display: true
            }
          }]
        }
      }
    });
  }

}

customElements.define('cryptoprice-dash', CryptopriceDash);