/**
 * columnRange图, 展示n条横向的线，可堆叠
 * @return {[type]} [description]
 */
const config = {
    chart: {
        type: 'columnrange',
        inverted: true,
        height: 20,
        spacing: [0, 0, 0, 0],
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

    xAxis: {
        categories: ['', '', ''],
        labels: {
            enabled: false,
        },
        lineWidth: 0,                // 坐标轴宽度
        gridLineWidth: 0,           // 网格
        tickWidth: 0,                 // 刻度线
    },

    yAxis: {
        title: {
            text: '',
        },
        labels: {
            enabled: false,           // 不显示坐标刻度
        },
        gridLineWidth: 0,
        lineWidth: 0,
    //    min:1,                      //刻度最小值，不设置默认自动
    //    max:4                       //刻度最大值，不设置默认自动
    },

    tooltip: {
        formatter() {
            return `<b>${this.series.name}</b><br/>${
                           this.x}: ${this.y}`;
        },
        followPointer: true,
    },

    plotOptions: {
        columnrange: {
            dataLabels: {
                enabled: true,
                formatter() {
                    return '';     // 控制显示每一个column开始和结束的数值
                },
            },
            pointWidth: 6,
            maxPointWidth: 6,
        },
    },

    legend: {
        enabled: false,             // 不显示图列
    },

    series: [{
        name: '',
    }],
};


export default config;
