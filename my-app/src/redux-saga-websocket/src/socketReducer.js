import Immutable from 'immutable';
import { createOrUpdateChannelAction, closeChannelAction } from './actions';

function socketReducer(state = Immutable.Map(), action) {
    if (action.type === createOrUpdateChannelAction.toString()) {
        return state.set(action.payload.uri, null);
    } else if (action.type === closeChannelAction.toString()) {
        return state.set(action.payload.uri, null);
    } else if (action.type === '@@redux-saga-websocket/MESSAGE') {
        return state.set(action.payload.uri, action.payload.data);
    }
    return state;
}

export default socketReducer;
