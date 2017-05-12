import invariant from 'invariant';
import _ from 'lodash';

const identify = x => x;

export default function createWebsocket(url, decode = identify, encode = identify, binaryType = 'arraybuffer') {
    invariant(window.WebSocket, 'WebSocket should be Object');

    /* TODO: check url whether a valid websocket url*/
    invariant(_.isString(url), 'url should be String');

    const websocket = new WebSocket(url);
    websocket.binaryType = binaryType;

    window.onbeforeunload = () => websocket.close();

    websocket.Send = (message) => {
        invariant(typeof encode === 'function', 'encode should be Function');
        websocket.send(encode(message));
    };

    websocket.onerror = () => {
        if (websocket.onError) {
            websocket.onError();
        }
    };

    websocket.onopen = (event) => {
        if (websocket.onOpen) {
            websocket.onOpen(event);
        }
    };

    websocket.onclose = () => {
        if (websocket.onClose) {
            websocket.onClose();
        }
    };

    websocket.onmessage = (event) => {
        invariant(typeof decode === 'function', 'decode should be Function');
        websocket.onMessage(decode(event.data));
    };
    return websocket;
}
