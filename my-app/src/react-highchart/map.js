/**
 * Created by QinBaobo on 2017/2/16.
 */

import React, { PropTypes } from 'react';
import Highcharts from 'highcharts/highstock';
import Immutable from 'immutable';
import { shallowEqualImmutable } from '../../components/util/helper';

require('highcharts/modules/map')(Highcharts);

const seriesData = require('./mapData/China_map_data.json');

/**
 * Map地图
 * @return {[type]} [description]
 */
function getHighMapChartOption() {
    return {
        chart: {
            type: 'map',
            map: seriesData,
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

        mapNavigation: {
            enabled: true,
        },
        credits: {
            enabled: false,
        },
        series: [{
            name: '',
        }],
    };
}

function getTypeOption(chartType) {
    if (chartType === 'map') {
        return getHighMapChartOption();
    }
    return null;
}


export default class ReactHighMap extends React.Component {

    constructor(props) {
        super(props);
        this.renderHighMaps = this.renderHighMaps.bind(this);
        this.defaultConfig = this.defaultConfig.bind(this);
    }

    componentDidMount() {
        if (this.props.config) {
            this.renderHighMaps(this.props.config);
        }
    }

    shouldComponentUpdate(nextProps) {
        if (shallowEqualImmutable(this.props, nextProps)) {
            return false;
        }
        this.renderHighMaps(nextProps.config);
        return false;
    }

    componentWillUnmount() {
        if (this.highmap) {
            this.highmap.destroy();
        }
    }

    defaultConfig() {
        return Immutable.fromJS({
            chart: {
                renderTo: this.chart,
                type: 'map',
            },
            credits: {
                enabled: false,
            },
        });
    }

    renderHighMaps(config) {
        if (this.highmap) {
            this.highmap.destroy();
            this.highmap = null;
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
        this.highmap = new Highcharts.Map(option);
    }

    render() {
        const { config, ...rest } = this.props;

        const ignoredConfig = config; // clear eslint

        return (
            // eslint-disable-next-line no-return-assign
            <div ref={chart => this.chart = chart} {...rest} />
        );
    }
}

ReactHighMap.propTypes = {
    config: PropTypes.shape({
        chart: PropTypes.shape({
            type: PropTypes.string.isRequired,
        }),
    }),
};

ReactHighMap.defaultProps = {
    config: null,
};

