/* eslint no-underscore-dangle: 0*/
import { Server } from 'mock-socket';
import { take, call } from 'redux-saga/effects';
import createSagaMiddleware from 'redux-saga';
import { applyMiddleware, createStore } from 'redux';
import Immutable from 'immutable';
import { combineReducers } from 'redux-immutable';
import ReduxSocket from '../reduxSocket';
import socketReducer from '../socketReducer';
import { createOrUpdateChannelAction } from '../actions';

const ip = 'ws://localhost:8090';
const SOCKET_OPEN = 0;
const SOCKET_MESSAGE = 1;
const SOCKET_PING = 2;
const SOCKET_CLOSE = 3;

// const messageStr = '@@redux-saga-websocket/MESSAGE';

jest.mock('warning');

const sagaMiddleware = createSagaMiddleware();

const store = createStore(
    combineReducers({
        socketReducer,
    }),
    Immutable.fromJS({}),
    applyMiddleware(sagaMiddleware)
);

describe('create ReduxSocket', () => {
    test('throw error if no options defined', () => {
        expect(() => {
            const ignored = new ReduxSocket();
        }).toThrow(/options should be a valid plain Object/);
    });

    test('throw error if no url defined', () => {
        expect(() => {
            const ignored = new ReduxSocket({});
        }).toThrow(/url should be a valid ws String/);
    });
});

describe('test createSocketChannel function', () => {
    let mockServer;
    let reduxSocket;
    let _socketEventChannel;
    let _socket;

    beforeEach(() => {
        mockServer = new Server(ip);
        reduxSocket = new ReduxSocket({ url: ip });
        const { socketEventChannel, socket } = reduxSocket.createSocketChannel();
        _socketEventChannel = socketEventChannel;
        _socket = socket;
    });

    afterEach(() => {
        mockServer.close();
        _socketEventChannel = null;
        _socket = null;
    });


    test('createSocketChannel return correctly, and return socket is connected', () => {
        expect(typeof _socketEventChannel.take === 'function').toBe(true);
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(_socket.readyState);
            }, 5);
        }).then((data) => {
            expect(data).toBe(1);
        });
    });

    test('createSocketChannel emit onOpen onMessage(PONG) onClose to channel', () => {
        const msg = [];

        function* takeChannel(chan) {
            while (true) { // eslint-disable-line
                yield take(chan);
            }
        }

        mockServer.on('connection', () => {
            mockServer.send('test message');
            mockServer.send('PONG');
        });

        return new Promise((resolve) => {
            setTimeout(() => {
                mockServer.close();
                const generator = takeChannel(_socketEventChannel);
                for (let index = 0; index < 4; index += 1) {
                    const next = generator.next();
                    next.value.TAKE.channel.take((event) => {
                        msg.push(event);
                    });
                }
                resolve(msg);
            }, 5);
        }).then((data) => {
            /**
             * mock-server websocket onmessage fired before onopen, it is a bug of mock-server
             * https://github.com/thoov/mock-socket/issues/157
             */
            expect(data[0].type).toBe(SOCKET_MESSAGE);
            expect(data[0].message).toBe('test message');
            expect(data[1].type).toBe(SOCKET_PING);
            expect(data[2].type).toBe(SOCKET_OPEN);
            expect(data[3].type).toBe(SOCKET_CLOSE);
        });
    });
});


describe('createSocket', () => {
    let mockServer;
    let reduxSocket;

    beforeEach(() => {
        mockServer = new Server(ip);
        reduxSocket = new ReduxSocket({ url: ip, reconnectionInterval: 50 });
    });

    afterEach(() => {
        mockServer.close();
    });

    test('createSocket', () => {
        sagaMiddleware.run(reduxSocket.createSocket);
        /**
         * test return -1 if called within reconnectionInterval
         */
        let generator = reduxSocket.createSocket();
        expect(generator.next()).toEqual({
            value: -1,
            done: true,
        });

        return new Promise((resolve) => {
            setTimeout(() => {
                /**
                 * test websock is connecting
                 */
                generator = reduxSocket.createSocket();
                const next = generator.next();
                resolve(next);
            }, 10);
        }).then((data) => {
            expect(data).toEqual({
                value: -1,
                done: true,
            });
        });
    });

    test('should cancel handleChannelEventTask', () => {
        let taskA = null;
        let taskB = null;
        function* testSaga() {
            yield call(reduxSocket.createSocket);
            taskA = reduxSocket.handleChannelEventTask;
            /**
             * skip some check
             */
            reduxSocket.createSocketTime = -100;
            reduxSocket.socket = null;
            yield call(reduxSocket.createSocket);
            taskB = reduxSocket.handleChannelEventTask;
        }
        sagaMiddleware.run(testSaga);
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(taskA !== taskB);
            }, 50);
        }).then((data) => {
            expect(data).toBeTruthy();
        });
    });
});

describe('createChannel closeChannel', () => {
    test('throw error if createChannel payload url is not String', () => {
        expect(() => {
            const reduxSocket = new ReduxSocket({ url: ip, reconnectionInterval: 50 });
            const generator = reduxSocket.createChannel({
                payload: {
                    data: '',
                },
            });
            generator.next();
        }).toThrow('channel uri should be String');
    });

    test('throw error if closeChannel payload uri is not String', () => {
        expect(() => {
            const reduxSocket = new ReduxSocket({ url: ip, reconnectionInterval: 50 });
            const generator = reduxSocket.closeChannel({
                payload: {
                    data: '',
                },
            });
            generator.next();
        }).toThrow('channel uri should be String');
    });

    test('createChannel put a action into dispatch channel and closeChannel take the action from dispatch channel', () => {
        const action = {
            payload: {
                uri: 'test',
                data: 'data',
            },
        };
        const reduxSocket = new ReduxSocket({ url: ip, reconnectionInterval: 50 });
        const mockServer = new Server(ip);
        sagaMiddleware.run(reduxSocket.createChannel, action);
        sagaMiddleware.run(reduxSocket.closeChannel, action);
        mockServer.close();
        return new Promise((resolve) => {
            reduxSocket.dispatchChannel.flush((data) => {
                resolve(data);
            });
        }).then((data) => {
            expect(data).toEqual(
                [{ data: 'data', opt: 'UPDATE', uri: 'test' }, { data: 'data', opt: 'DELETE', uri: 'test' }]
            );
        });
    });
});

describe('dispatchRequest', () => {
    let mockServer;
    let reduxSocket;

    const action = {
        payload: {
            uri: 'test',
            data: 'data',
        },
    };

    const actionA = {
        payload: {
            uri: 'testA',
            data: 'data',
        },
    };

    beforeEach(() => {
        mockServer = new Server(ip);
        reduxSocket = new ReduxSocket({ url: ip, reconnectionInterval: 50 });
    });

    afterEach(() => {
        mockServer.close();
    });

    test('dispatchRequest take right action', () => {
        sagaMiddleware.run(reduxSocket.createSocket);
        sagaMiddleware.run(reduxSocket.dispatchRequest, reduxSocket.dispatchChannel);
        sagaMiddleware.run(reduxSocket.createChannel, action);
        expect(reduxSocket.channelMap).toEqual({
            test: { data: 'data', opt: 'UPDATE', uri: 'test' },
        });
        sagaMiddleware.run(reduxSocket.closeChannel, action);
        expect(reduxSocket.channelMap).toEqual({});
    });

    test('dispatchRequest recover right action', () => {
        sagaMiddleware.run(reduxSocket.createSocket);
        sagaMiddleware.run(reduxSocket.createChannel, action);
        reduxSocket.channelMap.testA = actionA;
        sagaMiddleware.run(reduxSocket.closeChannel, actionA);
        sagaMiddleware.run(reduxSocket.dispatchRequest, reduxSocket.dispatchChannel);
        expect(reduxSocket.channelMap).toEqual({
            test: { data: 'data', opt: 'UPDATE', uri: 'test' },
        });
        sagaMiddleware.run(reduxSocket.closeChannel, action);
        expect(reduxSocket.channelMap).toEqual({});
    });
});


describe('handleChannelEvent', () => {
    let mockServer;
    let reduxSocket;

    beforeEach(() => {
        mockServer = new Server(ip);
        reduxSocket = new ReduxSocket({ url: ip, reconnectionInterval: -1 });
    });

    afterEach(() => {
        mockServer.close();
    });

    test('put a right message to redux store', () => {
        mockServer.on('connection', (_server) => {
            setTimeout(() => {
                mockServer.send(JSON.stringify({
                    uri: 'test',
                    success: true,
                    data: JSON.stringify({ test: 'test' }),
                }));
            }, 5);
        });

        sagaMiddleware.run(reduxSocket.createChannel, createOrUpdateChannelAction('test', { data: '123' }));

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(store.getState().toJS());
            }, 20);
        }).then((data) => {
            expect(data).toEqual(
                { socketReducer: { test: { test: 'test' } } }
            );
        });
    });

    test('re create socket when websocket closed and received message', () => {
        sagaMiddleware.run(reduxSocket.createChannel, createOrUpdateChannelAction('test', { data: '123' }));
        setTimeout(() => {
            mockServer.on('connection', (_server) => {
                setTimeout(() => {
                    mockServer.send(JSON.stringify({
                        uri: 'test',
                        success: true,
                        data: JSON.stringify({ test: 'test' }),
                    }));
                }, 5);
            });
            reduxSocket.socket.close();
        }, 5);

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(store.getState().toJS());
            }, 20);
        }).then((data) => {
            expect(data).toEqual(
                { socketReducer: { test: { test: 'test' } } }
            );
        });
    });
});


describe('pingSaga', () => {
    let mockServer;
    let reduxSocket;

    beforeEach(() => {
        mockServer = new Server('ws://localhost:8092');
        reduxSocket = new ReduxSocket({ url: 'ws://localhost:8092', reconnectionInterval: 50 });
    });

    afterEach(() => {
        mockServer.close();
    });

    test('send PING and server received', () => {
        let msg = '';
        mockServer.on('connection', (socket) => {
            socket.on('message', (message) => {
                msg = message;
            });
        });
        sagaMiddleware.run(reduxSocket.createSocket);

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(msg);
            }, 50);
        }).then((data) => {
            expect(data).toEqual('PING');
        });
    });

    test('received PONG message and update lastPingTime', () => {
        mockServer.on('connection', (socket) => {
            socket.on('message', (_message) => {
                mockServer.send('PONG');
            });
        });
        sagaMiddleware.run(reduxSocket.createSocket);
        const t1 = reduxSocket.lastPingTime;
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(reduxSocket.lastPingTime > t1);
            }, 100);
        }).then((data) => {
            expect(data).toBeTruthy();
        });
    });

    test('Pong TimeOut and reconnect socket', () => {
        sagaMiddleware.run(reduxSocket.createSocket);
        const t1 = reduxSocket.createSocketTime;
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(reduxSocket.createSocketTime > t1);
            }, 300);
        }).then((data) => {
            expect(data).toBeTruthy();
        });
    });
});
