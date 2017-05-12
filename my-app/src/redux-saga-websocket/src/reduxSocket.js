import { call, take, spawn, put, flush, fork, select } from 'redux-saga/effects';
import { buffers, channel, eventChannel } from 'redux-saga';
import _ from 'lodash';
import warning from 'warning';
import invariant from 'invariant';
import Immutable from 'immutable';
import websocket from './websocket';

const CHANNEL_UPDATE = 'UPDATE';
const CHANNEL_DELETE = 'DELETE';
// const SOCKET_AUTH = 'AUTH';

const SOCKET_OPEN = 0;
const SOCKET_MESSAGE = 1;
const SOCKET_PING = 2;
const SOCKET_CLOSE = 3;

const messageInState = (state, uri) => state.getIn(['socketReducer', uri]);

export default class ReduxSocket {
    constructor(options) {
        invariant(typeof options === 'object', 'options should be a valid plain Object');
        /* TODO: check url*/
        invariant(options.url, 'url should be a valid ws String');

        this.url = options.url;
        this.encode = options.encode;
        this.decode = options.decode;
        this.binaryType = options.binaryType;
        this.reconnectionInterval = options.reconnectionInterval || 60 * 1000;
        this.socket = null;
        this.socketEventChannel = null;
        this.createSocketTime = 0;
        this.lastPingTime = 0;
        this.dispatchChannel = null;
        this.pingChannel = null;
        this.channelMap = {};
        this.handleChannelEventTask = null;
        this.requestStr = options.requestStr || 'data';
        this.responseStr = options.responseStr || 'data';

        this.createSocket = this.createSocket.bind(this);
        this.createChannel = this.createChannel.bind(this);
        this.closeChannel = this.closeChannel.bind(this);
        this.dispatchRequest = this.dispatchRequest.bind(this);
        this.handleChannelEvent = this.handleChannelEvent.bind(this);
        this.createSocketChannel = this.createSocketChannel.bind(this);
        this.pingSaga = this.pingSaga.bind(this);
    }

    * createChannel({ payload }) {
        invariant(_.isString(payload.uri), 'channel uri should be String');
        if (this.socket === null) {
            yield call(this.createSocket);
        }
        const action = {
            opt: CHANNEL_UPDATE,
            uri: payload.uri,
        };
        action[this.requestStr] = payload.data;
        yield put(this.dispatchChannel, action);
    }

    * closeChannel({ payload }) {
        invariant(_.isString(payload.uri), 'channel uri should be String');
        const action = {
            opt: CHANNEL_DELETE,
            uri: payload.uri,
        };
        action[this.requestStr] = payload.data;
        yield put(this.dispatchChannel, action);
    }

    createPingEvent(secs) {  // eslint-disable-line
        return eventChannel((emitter) => {
            const iv = setInterval(() => {
                emitter('');
            }, secs);
            return () => {
                clearInterval(iv);
            };
        });
    }

    * pingSaga() {
        this.pingChannel = yield call(this.createPingEvent, this.reconnectionInterval);
        while (true) { //eslint-disable-line
            yield take(this.pingChannel);
            if (new Date().getTime() - this.lastPingTime > this.reconnectionInterval * 4) {
                if (this.socket !== null) {
                    this.socket.close();
                }
                yield call(this.createSocket);
            }
            if (this.socket.readyState === 1) {
                this.socket.Send('PING');
            } else if (this.socket.readyState === 2 || this.socket.readyState === 3) {
                yield call(this.createSocket);
            }
        }
    }

    * createSocket() {
        const curTime = new Date().getTime();
        if (curTime - this.createSocketTime <= this.reconnectionInterval) {
            return -1;
        }
        if (this.socket && (this.socket.readyState === 0 || this.socket.readyState === 1)) {
            return -1;
        }
        this.createSocketTime = curTime;
        if (this.dispatchChannel === null) {
            this.dispatchChannel = yield call(channel, buffers.expanding(20));
        }
        if (this.handleChannelEventTask !== null) {
            this.handleChannelEventTask.cancel();
            this.handleChannelEventTask = null;
        }
        if (this.pingChannel === null) {
            this.lastPingTime = curTime;
            yield spawn(this.pingSaga);
        }
        const { socketEventChannel, socket } = this.createSocketChannel();
        this.socketEventChannel = socketEventChannel;
        this.socket = socket;
        this.handleChannelEventTask = yield spawn(this.handleChannelEvent, socketEventChannel);
        return 0;
    }

    * dispatchRequest(chan) {
        const payloads = yield flush(chan);
        payloads.map((item) => {
            if (item.opt === CHANNEL_UPDATE) {
                this.channelMap[item.uri] = item;
            } else {
                delete this.channelMap[item.uri];
            }
            return item;
        });

        for (const key of Object.keys(this.channelMap)) {
            yield put(chan, this.channelMap[key]);
        }

        while (true) { // eslint-disable-line
            const payload = yield take(chan);
            warning(!(payload.opt === CHANNEL_DELETE && this.channelMap[payload.uri] === undefined),
                'close a unopened socket channel or an already closed socket channel');
            if (payload.opt === CHANNEL_UPDATE) {
                this.socket.Send(JSON.stringify(payload));
                this.channelMap[payload.uri] = payload;
            } else if (this.channelMap[payload.uri] !== undefined) {
                /**
                 * CHANNEL_DELETE
                 */
                this.socket.Send(JSON.stringify(payload));
                delete this.channelMap[payload.uri];
            }
        }
    }

    * handleChannelEvent(chan) {
        while (true) { // eslint-disable-line
            try {
                const payload = yield take(chan);
                if (payload.type === SOCKET_OPEN) {
                    yield fork(this.dispatchRequest, this.dispatchChannel);
                } else if (payload.type === SOCKET_MESSAGE) {
                    const message = JSON.parse(payload.message);
                    if (message.success) {
                        const selectData = yield select(messageInState, message.uri);
                        const data = Immutable.fromJS(JSON.parse(message[this.responseStr]));
                        if (!Immutable.is(data, selectData)) {
                            yield put({
                                type: '@@redux-saga-websocket/MESSAGE',
                                payload: {
                                    uri: message.uri,
                                    data,
                                },
                            });
                        }
                    }
                    warning(message.success, `socket return unsuccess message ${payload}`);
                } else if (payload.type === SOCKET_PING) {
                    this.lastPingTime = new Date().getTime();
                } else if (payload.type === SOCKET_CLOSE) {
                    yield spawn(this.createSocket);
                } else {
                    warning(false, `Unexpect Message ${payload}`);
                }
            } catch (err) {
                warning(false, `unexpect data from server ${err}`);
            }
        }
    }

    createSocketChannel() {
        const socket = websocket(this.url, this.decode, this.encode, this.binaryType);
        return {
            socketEventChannel: eventChannel((emit) => {
                const packetHandler = (event) => {
                    emit(event);
                };

                socket.onOpen = (event) => {
                    packetHandler({
                        type: SOCKET_OPEN,
                        message: event,
                    });
                };

                socket.onMessage = (event) => {
                    if (event === 'PONG') {
                        packetHandler({
                            type: SOCKET_PING,
                        });
                    } else {
                        packetHandler({
                            type: SOCKET_MESSAGE,
                            message: event,
                        });
                    }
                };

                socket.onError = (event) => {
                    warning(false, `socket closed onerror: ${JSON.stringify(event)}`);
                    packetHandler({
                        type: SOCKET_CLOSE,
                    });
                };

                socket.onClose = (event) => {
                    warning(false, `socket closed onclose: ${JSON.stringify(event)}`);
                    packetHandler({
                        type: SOCKET_CLOSE,
                    });
                };
                const unsubscribe = () => {
                    socket.close();
                };

                return unsubscribe;
            }, buffers.expanding(100)),
            socket,
        };
    }
}
