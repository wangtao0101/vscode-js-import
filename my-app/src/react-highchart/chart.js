import React, { PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Highcharts from 'highcharts/highstock';
import Immutable from 'immutable';
import domUtil from 'sie-util/dom';
import ScrollChart from './scrollChart';
import { isArray, isNULL, warning } from '../../components/util/helper';
import columnrange from './config/columnrange';
import onebar from './config/onebar';
import singleonebar from './config/singleonebar';
import splineThreeLines from './config/spline_threelines';
import splineAlarm from './config/spline_alarm';

require('highcharts/highcharts-more')(Highcharts);
require('highcharts/modules/no-data-to-display')(Highcharts);

const $ = require('jquery');

const EXTREMES_INTERVAL_TIME = 20000;

function getTypeOption(chartType) {
    if (chartType === 'columnrange') {
        return columnrange;
    } else if (chartType === 'onebar') {
        return onebar;
    } else if (chartType === 'singleonebar') {
        return singleonebar;
    } else if (chartType === 'spline_threelines') {
        return splineThreeLines;
    } else if (chartType === 'spline_alarm') {
        return splineAlarm;
    }

    return null;
}

export default class ReactHighchart extends React.Component {

    constructor(props) {
        super(props);
        this.renderChart = this.renderChart.bind(this);
        this.shouldRenderChart = this.shouldRenderChart.bind(this);
        this.addPointsToSeries = this.addPointsToSeries.bind(this);
        this.addArraySeriesToSeries = this.addArraySeriesToSeries.bind(this);
        this.resetExtremesInterval = this.resetExtremesInterval.bind(this);

        this.updateChart = this.updateChart.bind(this);

        this.highchart = null;
        /**
         * 当chart渲染后，如果此时修改了config但chart不在可渲染区域，此时，isDirty被设置为true, 等到需要渲染时chart会被重新渲染
         */
        this.isDirty = false;
        this.series = [];
    }

    componentDidMount() {
        Highcharts.setOptions({
            global: {
                useUTC: false,
            },
            lang: {
                noData: $.i18n.prop('no_data'),
            },
        });

        if (this.props.config && (this.props.everyTimeRender || this.shouldRenderChart())) {
            this.renderChart(this.props.config, this.props.realtime, this.props.xAxisMaxWidth);
        }
    }

    componentWillReceiveProps(nextProps) {
        if (!isNULL(this.interval) && !nextProps.realtime) {
            clearInterval(this.interval);
            this.interval = null;
        }

        if (this.shouldRenderChart() && !isNULL(this.highchart)) {
            if (nextProps.realtime && isNULL(this.interval)) {
                this.interval = setInterval(this.resetExtremesInterval, EXTREMES_INTERVAL_TIME);
            }
        }

        if (Immutable.is(this.props.config, nextProps.config)) {
            if (!Immutable.is(this.props.series, nextProps.series) && !isNULL(nextProps.series)) {
                const series = nextProps.series.toJS();
                series.forEach((item, i) => {
                    if (this.series[i]) {
                        this.series[i].push(item);
                    } else {
                        this.series[i] = [];
                        this.series[i].push(item);
                    }
                });
                if (!isNULL(this.highchart) && this.shouldRenderChart() && nextProps.realtime) {
                    if (this.series.length !== 0) {
                        this.addPointsToSeries(this.series, nextProps);
                        this.series = [];
                    }
                }
            }
        } else {
            // 修改config后会重置 缓存在series中需要动态添加的点
            this.series = [];

            // 重置chart的高度
            if (this.chart && !isNULL(nextProps.config)) {
                let height = nextProps.config.getIn(['chart', 'height']);
                if (!isNULL(height)) {
                    height = parseInt(height, 10);
                    this.chart.style.height = `${height}px`;
                }
            }

            if (nextProps.everyTimeRender) {
                this.renderChart(nextProps.config, nextProps.realtime, nextProps.xAxisMaxWidth);
                return;
            }

            if (this.shouldRenderChart()) {
                this.renderChart(nextProps.config, nextProps.realtime, nextProps.xAxisMaxWidth);
            } else {
                this.isDirty = true;
            }
        }
    }

    shouldComponentUpdate(_nextProps) {
        return false;
    }

    componentWillUnmount() {
        if (!isNULL(this.highchart)) {
            this.highchart.destroy();
        }

        if (!isNULL(this.interval)) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    /**
     * Gets the x axis from point.
     *
     * @param      {<type>}  item    The item
     * @return     {<type>}  The x axis from point.
     */
    getXAxisFromPoint(item) {
        let x = null;
        // 支持[x, y]  或者 { x:x, y:y} 的形式
        if (isArray(item)) {
            if (isNULL(item[1]) || isNaN(item[1])) {
                return x;
            }
            x = item[0];
        } else {
            if (isNULL(item.y) || isNaN(item.y) || isNULL(item.x) || isNaN(item.x)) {
                return x;
            }
            x = item.x;
        }
        return x;
    }

    /**
     * Adds points to all highchart series.
     *
     * @param      {<type>}  series  The series
     * @param      {<type>}  props   this.props or nextprops
     */
    addPointsToSeries(series, props) {
        if (isNULL(props.xAxisMaxWidth)) {
            series.forEach((item, i) => {
                item.forEach((point) => {
                    this.highchart.series[i].addPoint(point, false, props.shift);
                });
                this.highchart.redraw();
            });
        } else {
            series.forEach((item, i) => {
                this.addArraySeriesToSeries(item, i, props.xAxisMaxWidth);
            });
        }
    }

    /**
     * Adds one series to one highchart series.
     * 将数据add到highchart中, 添加点时如果数据超出了xAxisMaxWidth需要控制shift出series.data中的数据
     * 虽然resetExtremesInterval定时器会设置最大值和最小值，保持同一界面的所有x轴范围相同
     * 但是这样series.data中数据会持续增长，下面的代码保证了data中的数据保持合适的尺寸
     * @param      {<type>}  series         The series
     * @param      {<type>}  seriesIndex    The series index
     * @param      {number}  xAxisMaxWidth  The x axis maximum width
     */
    addArraySeriesToSeries(series, seriesIndex, xAxisMaxWidth) {
        if (isNULL(series) || !isArray(series)) {
            warning(false, `error format of series ${series} ${seriesIndex}`);
        }
        if (series.length === 0) {
            return;
        }

        const firstPoint = this.highchart.series[seriesIndex].data[0];
        let firstXAxis = 0;
        if (isNULL(firstPoint)) {
            firstXAxis = this.getXAxisFromPoint(series[0]);
        } else {
            firstXAxis = this.getXAxisFromPoint(firstPoint);
        }
        if (isNULL(firstXAxis)) {
            warning(false, `getXAxisFromPoint return null or undefined xAxis ${series} ${seriesIndex}`);
            return;
        }

        // 找到series数组中，series.data.push 和 series.data.shift的分界线
        let moveIndex = series.length;
        let xAxis;
        for (let i = 0; i < series.length; i += 1) {
            xAxis = this.getXAxisFromPoint(series[i]);
            if (isNULL(xAxis)) {
                warning(false, `getXAxisFromPoint return null or undefined xAxis ${series} ${seriesIndex}`);
                return;
            }
            if (Math.abs(xAxis - firstXAxis) >= xAxisMaxWidth) {
                moveIndex = i;
                break;
            }
        }

        /**
         * 为了简化计算过程, 这里没有严格保证所有数据加入series后,
         * data[length-1] - data[0] <= xAxisMaxWidth, 没有必要. (理论上如果点是均匀的, 该等式在这里一定成立)
         */
        const pushSeries = series.slice(0, moveIndex);
        const shiftSeries = series.slice(moveIndex, series.length);
        pushSeries.forEach((item) => {
            this.highchart.series[seriesIndex].addPoint(item, false, false);
        });
        shiftSeries.forEach((item) => {
            this.highchart.series[seriesIndex].addPoint(item, false, true);
        });
        this.highchart.redraw();
    }

    /**
     * 定时器，重新设置x轴最大值和最小值，保证间隔时间为props.xAxisMaxWidth
     */
    resetExtremesInterval() {
        if (!isNULL(this.highchart) && this.shouldRenderChart()) {
            const cur = new Date().getTime();
            this.highchart.xAxis[0].setExtremes(cur - this.props.xAxisMaxWidth, cur, false);
            this.highchart.redraw();
        }
    }

    /**
     * 是否需要渲染，只有在chart在浏览器试图范围内才会被渲染
     * @return     {boolean}  { description_of_the_return_value }
     */
    shouldRenderChart() {
        return domUtil.isInViewPortVertical(this.chart);
    }

    updateChart() {
        if (this.shouldRenderChart()) {
            if (isNULL(this.highchart) || this.isDirty) {
                this.renderChart(this.props.config, this.props.realtime, this.props.xAxisMaxWidth);
            }
            if (this.props.realtime && isNULL(this.interval)) {
                this.interval = setInterval(this.resetExtremesInterval, EXTREMES_INTERVAL_TIME);
            }
            if (this.series.length !== 0) {
                this.addPointsToSeries(this.series, this.props);
                this.series = [];
            }
        } else if (!isNULL(this.highchart) && this.props.realtime && !isNULL(this.interval)) {
            /**
             * chart不可见时，关闭定时器
             */
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    defaultConfig() {
        return Immutable.fromJS({
            chart: {
                renderTo: this.chart,
            },
            credits: {
                enabled: false,
            },
        });
    }

    /**
     * 渲染或者重新渲染highchart
     *
     * @param      {<type>}  config    The configuration
     * @param      {<type>}  realtime  The realtime
     */
    renderChart(config, realtime, xAxisMaxWidth) {
        if (!isNULL(this.interval)) {
            clearInterval(this.interval);
            this.interval = null;
        }

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

        /**
         * 设置x轴的宽度
         */
        if (realtime) {
            try {
                const data = option.series[0].data;
                const point = data[data.length - 1];
                const max = this.getXAxisFromPoint(point) - xAxisMaxWidth;
                if (isNaN(max)) {
                    warning('xAxisMaxWidth or series data maybe undefined!');
                } else {
                    option.xAxis.min = max;
                }
            } catch (e) {
                warning(e);
            }
        }

        if (isNULL(this.highchart)) {
            this.highchart = new Highcharts.Chart(option);
        } else {
            this.highchart.destroy();
            this.highchart = new Highcharts.Chart(option);
        }
        this.isDirty = false;

        if (realtime) {
            this.interval = setInterval(this.resetExtremesInterval, EXTREMES_INTERVAL_TIME);
        }
    }

    render() {
        var { config, series, xAxisMaxWidth, shift, realtime, everyTimeRender, ...rest } = this.props;  //eslint-disable-line

        const style = {
            height: '400px',
        };
        let height = config.getIn(['chart', 'height']);
        if (!isNULL(height)) {
            height = parseInt(height, 10);
            style.height = `${height}px`;
        }
        return (
            <ScrollChart updateChart={this.updateChart}>
                <div ref={chart => (this.chart = chart)} style={style} {...rest} />
            </ScrollChart>
        );
    }
}

ReactHighchart.propTypes = {
    config: ImmutablePropTypes.contains({
        chart: ImmutablePropTypes.contains({
            type: PropTypes.string.isRequired,
            height: PropTypes.number,
        }),
    }),
    xAxisMaxWidth: PropTypes.number,
    shift: PropTypes.bool,
    realtime: PropTypes.bool,
    series: ImmutablePropTypes.list,
    everyTimeRender: PropTypes.bool,
};

ReactHighchart.defaultProps = {
    config: null,
    xAxisMaxWidth: null, // x轴上数据的最大宽度
    shift: false, // 如果没有定义xAxisMaxWidth, 则动态添加数据时是否移出第一个点
    series: Immutable.List(),   // 动态添加的店的集合，格式和highchart.series.data相同，支持[]和{}的xingzhi
    realtime: false, // 是否动态更新 mix max
    everyTimeRender: false, //是否每次config变化都渲染(某些absolute的chart 会导致渲染时机判断不正确，这种情况下的chart必须每次都渲染)
};

