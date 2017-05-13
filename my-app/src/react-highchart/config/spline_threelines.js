import highchartColor from './constant';

const config = {
    chart: {
        type: 'spline',
    },
    title: {
        style: {
            fontWeight: 600,
        },
    },
    xAxis: {
        tickPixelInterval: 200,
    },
    yAxis: [
        {
            title: {
                text: '',
            },
            labels: {
                align: 'left',
                style: {
                    color: '#3c8dbc',
                },
            },
        },
        {
            title: {
                text: '',
            },
            opposite: true,
            labels: {
                align: 'right',
                style: {
                    color: '#a90329',
                },
            },
        },
    ],
    plotOptions: {
        series: {
            lineWidth: 2,
            marker: {
                enabled: false,
            },
            states: {
                hover: {
                    enabled: true,
                    lineWidth: 3,
                    marker: {
                        radius: 3,
                    },
                },
            },
        },
    },
    tooltip: {
        valueSuffix: '',
    },
    legend: {
        layout: 'horizontal',
        align: 'center',
        verticalAlign: 'bottom',
        borderWidth: 0,
    },
    series: [
        {
            color: highchartColor.REAL,
            yAxis: 0,
        },
        {
            color: highchartColor.ESTIMATED,
            yAxis: 0,
        },
        {
            color: highchartColor.RESIDUAL,
            yAxis: 1,
        },
    ],
};

export default config;
