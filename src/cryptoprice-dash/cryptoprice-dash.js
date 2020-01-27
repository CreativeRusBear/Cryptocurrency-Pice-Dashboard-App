/**
 * @version v1.1.0
 * @author Artem Gusev <gusev2014russia@mail.ru> (CreativeRusBear)
 * @copyright Artem Gusev 2020
 */

import {PolymerElement, html} from '@polymer/polymer/polymer-element';
import {afterNextRender} from '@polymer/polymer/lib/utils/render-status.js';

import '@polymer/iron-ajax/iron-ajax';
import '@polymer/polymer/lib/elements/dom-repeat.js';

import '@polymer/paper-spinner/paper-spinner-lite.js';
import '@polymer/paper-button/paper-button.js';

import '@polymer/paper-styles/typography.js';

/**
 * @class
 * @customElement
 * @extends {PolymerElement}
 * @example
 * <cryptoprice-dash></ryptoprice-dash>
 */
class CryptopriceDash extends PolymerElement {
	static get template () {
		return html `
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
                            <paper-button 
                                noink 
                                on-click="_getCurrencyHistoricData">[[item.name]] -  [[item.price]] RUB
                            </paper-button>
                        </template>
                    </dom-repeat>
                </div>
                
                <div id="canvas_container">
                    <canvas id="canvas" width="5" height="3"></canvas>
                </div>
            </div>
        `;
	}


	static get properties () {
		return {
			/**
			 * @description Сryptocurrencies that reflect statistics
			 * @type Array
			 * @memberOf CryptopriceDash
			 */
			currencies: {
				type  : Array,
				value : [
					{
						code  : 'BTC',
						name  : 'Bitcoin',
						price : 0,
					},
					{
						code  : 'ETH',
						name  : 'Ethereum',
						price : 0,
					},
					{
						code  : 'LTC',
						name  : 'Litecoin',
						price : 0,
					},
				],
			},
			/**
			 * @type Boolean
			 * @memberOf CryptopriceDash
			 */
			loading: {
				type   : Boolean,
				notify : true,
				value  : false,
			},

			lineChart: {},
		};

	}

	ready () {
		super.ready();
		afterNextRender(this, () => {
			this._getCurrencyData();
			this._getCurrencyHistoricData(this.currencies[0].code);
		});
	}

	/**
	 * @method
	 * @description load info about a specific cryptocurrency
	 * @private
	 */
	_getCurrencyData () {
		const ajax = this.$.coinbase;
		const currencies = this.currencies;
		currencies.forEach(item => {
			ajax.url = `https://api.coinbase.com/v2/prices/${item.code}-RUB/spot`;
			ajax.generateRequest();
		});
	}

	/**
	 * @method
	 * @description load historic info about a specific cryptocurrency
	 * @param {Object} currency - event's object
	 * @private
	 */
	_getCurrencyHistoricData (currency) {
		if (currency instanceof Event) currency = currency.model.item.code;
		const ajax = this.$.coinbase;
		ajax.url = `https://api.coinbase.com/v2/prices/${currency}-RUB/historic?period=month`;
		ajax.generateRequest();

	}

	/**
	 * @method
	 * @description Get response from server
	 * @param {Object} res - response from API
	 * @private
	 */
	_handleResponse (res) {
		if (res.detail.response.data.amount) this._computeCurrencyPrice(res.detail);
		else this._computeGraph(res.detail);
	}

	/**
	 * @method
	 * @description load basic data about cryptocurrencies
	 * @param {HTMLElement} data - <iron-request> component
	 * @private
	 */
	_computeCurrencyPrice (data) {
		const code = data.url.substring(35, 38);
		const index = this.currencies.map(item => item.code).indexOf(code);
		const cryptoPrice = Number(data.response.data.amount);
		this.set(`currencies.${index}.price`, cryptoPrice.toFixed(2));
	}

	/**
	 * @method
	 * @description formation of date and time in a human-readable format
	 * @param {String} datestring - date and time
	 * @return {String} - date and time in a human-readable format
	 * @private
	 */
	_computeDateTime (datestring) {
		return datestring ? moment(datestring, 'YYYY-MM-DDThh:mm:aaZ').format('LLL') : datestring;
	}

	/**
	 * @method
	 * @description load full information about a specific cryptocurrency and
	 * based on this information generates a chart
	 * @param {HTMLElement} data  - <iron-request> component
	 * @private
	 */
	_computeGraph (data) {
		let code;
		this.currencies.forEach(item => {
			if (item.code == data.url.substring(35, 38)) {
				code = item.name;
			}
		});
		const labels = [];
		const prices = [];
		data.response.data.prices.forEach(item => {
			labels.push(this._computeDateTime(item.time));
			prices.push(item.price);
		});
		this._generateLineChart(labels, prices, code);
	}

	/**
	 * @method
	 * @description Generate chart about a specific cryptocurrency with full information
	 * @param {Array} labels - Dates array
	 * @param {Array} prices - Prices array
	 * @param {String} labelName - Crypto name
	 * @private
	 */
	_generateLineChart (labels, prices, labelName) {
		if (this.lineChart) this.lineChart.destroy();
		const ctx = this.$.canvas.getContext('2d');
		this.lineChart = new Chart(ctx, {
			type : 'line',
			data : {
				labels   : labels.reverse(),
				datasets : [
					{
						pointRadius     : 0,
						label           : labelName,
						backgroundColor : 'rgba(111, 124, 186, 0.1)',
						borderColor     : 'rgba(111, 124, 186, 1)',
						borderWidth     : 2,
						data            : prices.reverse(),
					},
				],
			},
			options: {
				responsive : true,
				animation  : {
					duration : 1300,
					hover    : {
						animationDuration: 0,
					},
				},
				tooltips: {
					mode      : 'index',
					intersect : false,
				},
				scales: {
					xAxes: [ {
						gridLines: {
							display: true,
						},
					} ],
					yAxes: [ {
						gridLines: {
							display: true,
						},
					} ],
				},
			},
		});
	}
}

customElements.define('cryptoprice-dash', CryptopriceDash);
