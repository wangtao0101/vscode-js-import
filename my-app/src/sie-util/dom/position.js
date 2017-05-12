import _ from 'lodash';

export function getElementTop(element) {
    let actualTop = element.offsetTop;
    let current = element.offsetParent;
    while (current != null) {
        actualTop += current.offsetTop + current.clientTop;
        current = current.offsetParent;
    }
    return actualTop;
}

export function isInViewPortVertical(element) {
    if (!_.isElement(element)) {
        return false;
    }
    const bodyScrollTop = document.body.scrollTop;
    const bodyOffsetHeight = document.body.offsetHeight;
    const chartOffsetTop = getElementTop(element);
    const chartOffsetHeight = element.offsetHeight;
    if ((bodyScrollTop + bodyOffsetHeight > chartOffsetTop) &&
        (bodyScrollTop < chartOffsetTop + chartOffsetHeight)) {
        return true;
    }
    return false;
}
