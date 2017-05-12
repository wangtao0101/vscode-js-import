import { takeEvery } from 'redux-saga/effects';
import { createOrUpdateChannelAction, closeChannelAction } from './actions';
import ReduxSocket from './reduxSocket';

export default function* socketSaga(options) {
    const saga = new ReduxSocket(options);
    yield takeEvery(createOrUpdateChannelAction, saga.createChannel);
    yield takeEvery(closeChannelAction, saga.closeChannel);
}
