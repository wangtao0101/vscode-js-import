import { Server, WebSocket } from 'mock-socket';
import newWebsocket from '../websocket';

const ip = 'ws://localhost:8090';

describe('create newWebsocket', () => {
    test('throw error if no window.Websocket defined', () => {
        expect(() => {
            newWebsocket(ip);
        }).toThrow(/WebSocket should be Object/);
    });

    test('throw error if no url defined', () => {
        expect(() => {
            window.WebSocket = WebSocket;
            newWebsocket();
        }).toThrow(/url should be String/);
    });
});


describe('newWebsocket function', () => {
    let mockServer;

    beforeEach(() => {
        mockServer = new Server(ip);
    });

    afterEach(() => {
        mockServer.close();
    });

    test('onOpen', () => {
        const websocket = newWebsocket(ip);
        return new Promise((resolve) => {
            websocket.onOpen = () => {
                resolve();
            };
        }).then(() => {
            expect(true).toBe(true);
        });
    });

    test('onClose', () => {
        const websocket = newWebsocket(ip);
        return new Promise((resolve) => {
            websocket.onClose = () => {
                resolve();
            };
            mockServer.close();
        }).then(() => {
            expect(true).toBe(true);
        });
    });

    test('onMessage', () => {
        mockServer.on('connection', () => {
            mockServer.send('test message');
        });
        const websocket = newWebsocket(ip);
        return new Promise((resolve) => {
            websocket.onMessage = (data) => {
                resolve(data);
            };
        }).then((data) => {
            expect(data).toBe('test message');
        });
    });

    test('Send message', () => {
        let message = '';
        mockServer.on('message', (data) => {
            message = data;
        });
        const websocket = newWebsocket(ip);
        return new Promise((resolve) => {
            websocket.Send('test message');
            setTimeout(() => {
                resolve(message);
            }, 5);
        }).then((data) => {
            expect(data).toBe('test message');
        });
    });

    test('throw error if decode is not function', () => {
        mockServer.on('connection', () => {
            mockServer.send('test message');
        });
        const ignoredwebsocket = newWebsocket(ip, 'decode', 'encode');
        return new Promise((resolve) => {
            window.onerror = (msg) => {
                resolve(msg);
                window.onerror = undefined;
            };
        }).then((data) => {
            expect(data).toBe('decode should be Function');
        });
    });

    test('throw error if encode is not function', () => {
        const websocket = newWebsocket(ip, 'decode', 'encode');
        expect(() => {
            websocket.Send('test message');
        }).toThrow('encode should be Function');
    });

    test('decode', () => {
        const decode = x => `${x} decode`;
        const encode = x => `${x} encode`;
        const websocket = newWebsocket(ip, decode, encode);
        mockServer.on('connection', () => {
            mockServer.send('test message');
        });
        return new Promise((resolve) => {
            websocket.onMessage = (data) => {
                resolve(data);
            };
        }).then((data) => {
            expect(data).toBe('test message decode');
        });
    });

    test('encode', () => {
        const decode = x => `${x} decode`;
        const encode = x => `${x} encode`;
        const websocket = newWebsocket(ip, decode, encode);
        let message = '';
        mockServer.on('message', (data) => {
            message = data;
        });
        return new Promise((resolve) => {
            websocket.Send('test message');
            setTimeout(() => {
                resolve(message);
            }, 5);
        }).then((data) => {
            expect(data).toBe('test message encode');
        });
    });
});
