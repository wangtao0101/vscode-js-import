const createOrUpdate = '@@redux-saga-websocket/CREATE_OR_UPDATE_CHANNEL';
const close = '@@redux-saga-websocket/CLOSE_CHANNEL';

export function createOrUpdateChannelAction(uri, data) {
    return {
        type: createOrUpdate,
        payload: {
            uri,
            data,
        },
    };
}

export function closeChannelAction(uri) {
    return {
        type: close,
        payload: {
            uri,
        },
    };
}

createOrUpdateChannelAction.toString = () => createOrUpdate;
closeChannelAction.toString = () => close;
