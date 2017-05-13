import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

export default class ScrollChart extends React.Component {
    constructor(props) {
        super(props);

        this.reflowEvent = this.reflowEvent.bind(this);
        this.scrollListener = _.debounce(this.scrollListener.bind(this), 300);
    }

    componentDidMount() {
        window.addEventListener('scroll', this.scrollListener);
        // TODO: 处理highchart 监听 sidebar拖动的功能 #p1
        // document.getElementById('sidebartoggle').addEventListener('click', this.reflowEvent);
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.scrollListener);
        // document.getElementById('sidebartoggle').removeEventListener('click', this.reflowEvent);
    }

    reflowEvent() {
        // const that = this;
        // setTimeout(() => {
        //     this.props.reflowChart();
        // }, 0);
    }

    scrollListener() {
        this.props.updateChart();
    }

    render() {
        return React.Children.only(this.props.children);
    }
}

ScrollChart.propTypes = {
    children: PropTypes.element.isRequired,
    updateChart: PropTypes.func.isRequired,
};
