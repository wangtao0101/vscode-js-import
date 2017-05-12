import { Server } from 'mock-socket';
import { applyMiddleware, createStore } from 'redux';
import Immutable from 'immutable';
import createSagaMiddleware from 'redux-saga';
import { combineReducers } from 'redux-immutable';
import { socketSaga, socketReducer, createOrUpdateChannelAction, closeChannelAction } from '../';

jest.mock('warning');

const ip = 'ws://localhost:8090';

const sagaMiddleware = createSagaMiddleware();

const store = createStore(
    combineReducers({
        socketReducer,
    }),
    Immutable.fromJS({}),
    applyMiddleware(sagaMiddleware)
);

test('create channel and reduce message', () => {
    const mockServer = new Server(ip);
    mockServer.on('connection', (socket) => {
        socket.on('message', (message) => {
            if (message === 'PING') {
                mockServer.Send('PONG');
            } else {
                mockServer.send(JSON.stringify({
                    uri: 'test',
                    success: true,
                    data: JSON.stringify({ test: 'test' }),
                }));
            }
        });
    });
    sagaMiddleware.run(socketSaga, { url: ip });

    store.dispatch(createOrUpdateChannelAction('test'));
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(store.getState().toJS());
            mockServer.close();
        }, 20);
    }).then((data) => {
        expect(data).toEqual(
            { socketReducer: { test: { test: 'test' } } }
        );
    });
});

test('create channel and then close channel', () => {
    const mockServer = new Server(ip);
    const urlMap = {};
    mockServer.on('connection', (socket) => {
        urlMap[socket.url] = socket.url;
        socket.on('message', (message) => {
            if (message === 'PING') {
                mockServer.Send('PONG');
            } else {
                const data = JSON.parse(message);
                if (data.opt === 'DELETE') {
                    delete urlMap[socket.url];
                }
            }
        });
    });
    sagaMiddleware.run(socketSaga, { url: ip });

    store.dispatch(createOrUpdateChannelAction('test'));
    return new Promise((resolve) => {
        setTimeout(() => {
            store.dispatch(closeChannelAction('test'));
            resolve(urlMap);
        }, 20);
    }).then((data) => {
        expect(data).toEqual({});
    });
});
