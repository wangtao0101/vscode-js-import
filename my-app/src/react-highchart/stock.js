import React, { PropTypes } from 'react';
import Highcharts from 'highcharts/highstock';
import Immutable from 'immutable';
import _ from 'lodash';
import domUtil from 'sie-util/dom';
import ScrollChart from './scrollChart';

require('highcharts/highcharts-more')(Highcharts);

function getHighStockChartOption() {
    return {
        chart: {
            type: 'line',
            // 统一设置highcharts的字体
            style: {
                fontFamily: '"Siemens en", "Siemens ch", sans-serif',
            },
        },
        title: {
            text: '',
        },
        subtitle: {
            text: '',
        },
        series: [{
            name: '',
        }],
    };
}

function getTypeOption(chartType) {
    if (chartType === 'line') {
        return getHighStockChartOption();
    }

    return null;
}

export default class ReactHighStock extends React.Component {

    constructor(props) {
        super(props);
        this.renderHighStock = this.renderHighStock.bind(this);
        this.defaultConfig = this.defaultConfig.bind(this);
        this.shouldRenderChart = this.shouldRenderChart.bind(this);
        this.updateChart = this.updateChart.bind(this);

        this.updateSeries = this.updateSeries.bind(this);

        this.isConfigDirty = false;
        this.isSeriesDirty = false;
        this.highchart = null;
        this.series = null;
        this.seriesMin = null;
        this.seriesMax = null;
    }

    componentDidMount() {
        if (this.shouldRenderChart()) {
            this.renderHighStock(this.props.config);
        } else {
            this.isConfigDirty = true;
        }
    }

    componentWillReceiveProps(nextProps) {
        if (!Immutable.is(nextProps.config, this.props.config)) {
            this.isConfigDirty = false;
            this.isSeriesDirty = false;
            /**
             * If we have new highstock config, that means the series cache is invalid
             */
            this.series = null;
            if (this.shouldRenderChart()) {
                this.renderHighStock(nextProps.config);
            } else {
                this.isConfigDirty = true;
            }
        }
    }

    shouldComponentUpdate(_nextProps) {
        return false;
    }

    componentWillUnmount() {
        if (this.highchart) {
            this.highchart.destroy();
            this.highchart = null;
        }
    }

    defaultConfig() {
        return Immutable.fromJS({
            chart: {
                renderTo: this.chart,
                type: 'line',
            },
            credits: {
                enabled: false,
            },
        });
    }

    updateSeries(series, min, max) {
        if (this.highchart === null || !this.shouldRenderChart()) {
            this.series = series;
            this.seriesMin = min;
            this.seriesMax = max;
            this.isSeriesDirty = true;
            return;
        }
        series.forEach((serie, index) => {
            this.highchart.series[index].setData(serie.data);
        });
        this.highchart.xAxis[0].setExtremes(min, max, false);
        this.highchart.redraw();
    }

    shouldRenderChart() {
        return domUtil.isInViewPortVertical(this.chart);
    }

    updateChart() {
        if (this.shouldRenderChart()) {
            if (this.isConfigDirty) {
                this.isConfigDirty = false;
                this.renderHighStock(this.props.config);
            }
            if (this.isSeriesDirty) {
                this.isSeriesDirty = false;
                this.updateSeries(this.series, this.seriesMin, this.seriesMax);
            }
        }
    }

    renderHighStock(config) {
        let option;
        const typeOption = getTypeOption(config.get('chart').get('type'));
        if (typeOption === null) {
            option = this.defaultConfig().mergeDeep(config).toJS();
        } else {
            option = this.defaultConfig()
                .mergeDeep(typeOption)
                .mergeDeep(config).updateIn(['chart', 'type'], () => typeOption.chart.type)
                .toJS();
        }

        if (this.highchart === null) {
            this.highchart = new Highcharts.StockChart(option);
        } else {
            this.highchart.destroy();
            this.highchart = new Highcharts.StockChart(option);
        }
    }

    render() {
        const { config } = this.props;
        const style = {
            height: '500px',
        };
        let height = config.getIn(['chart', 'height']);
        if (!_.isNil(height)) {
            height = parseInt(height, 10);
            style.height = `${height}px`;
        }

        return (
            <ScrollChart updateChart={this.updateChart}>
                <div ref={chart => (this.chart = chart)} style={style} />
            </ScrollChart>
        );
    }
}

ReactHighStock.propTypes = {
    config: PropTypes.shape({
        chart: PropTypes.shape({
            type: PropTypes.string.isRequired,
        }),
    }).isRequired,
};
