const config = {
    chart: {
        type: 'spline',
        backgroundColor: '#F5F5F5',
    },
    title: {
        text: null,
    },
    legend: {
        enabled: false,
    },
    xAxis: {
        title: {
            text: null,
        },
        type: 'datetime',
        tickInterval: null,
        tickPixelInterval: 200,
        labels: {
            enabled: false,
        },
        lineWidth: 0,                // 坐标轴宽度
        gridLineWidth: 0,           // 网格
        tickWidth: 0,
    },
    yAxis: {
        plotLines: [{
            value: 0,
        }],
        title: {
            text: '',
        },
        labels: {
            enabled: false,
        },
        lineWidth: 0,                // 坐标轴宽度
        gridLineWidth: 0,           // 网格
        tickWidth: 0,
    },
    plotOptions: {
        series: {
            lineWidth: 4,
            marker: {
                enabled: true,
            },
            states: {
                hover: {
                    enabled: true,
                    lineWidth: 5,
                    marker: {
                        radius: 3,
                    },
                },
            },
        },
    },
    tooltip: {
        valueSuffix: '',
        followPointer: true,
        hideDelay: 100,
    },
    series: [{
        turboThreshold: 21600,
        color: '#778B41',
        yAxis: 0,
    }],
};

export default config;

