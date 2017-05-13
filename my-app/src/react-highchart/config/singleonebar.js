/**
 * onebar图，展示一条横向的线，线被分割成多个线段
 * @return {[type]} [description]
 */
const config = {
    chart: {
        type: 'bar',
        height: 32,
        spacing: [10, 20, 10, 20],
        backgroundColor: '#F5F5F5',
        animation: false,
    },
    title: {
        text: '',
    },
    xAxis: {
        categories: ['Apples'],
        labels: {
            enabled: false,
        },
        lineWidth: 0,                // 坐标轴宽度
        gridLineWidth: 0,           // 网格
        tickWidth: 0,
    },
    yAxis: {
        title: {
            text: '',
        },
        labels: {
            enabled: false,
        },
        lineWidth: 0,                // 坐标轴宽度
        gridLineWidth: 0,           // 网格
        tickWidth: 0,
        min: 0,                      // 刻度最小值，不设置默认自动
        max: 8,
    },
    tooltip: {
        formatter() {
            if (this.series.name === 'Jane') {
                return false;// return false 可以控制不现实tooltip
            }
            return `<b>${this.series.name}</b><br/>${
                                this.x}: ${this.y}`;
        },
        followPointer: true,
        hideDelay: 100,
    },
    legend: {
        enabled: false,
    },
    plotOptions: {
        series: {
            pointWidth: 2,
            /*marker: {
                enabled: false,
            },
            states:{
                hover:{
                    enabled: true,
                    lineWidth:30,
                    marker:{
                        radius:3
                    }
                }
            }*/
        },
    },
};

export default config;
