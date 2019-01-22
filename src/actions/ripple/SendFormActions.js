/* @flow */
import TrezorConnect from 'trezor-connect';
import * as NOTIFICATION from 'actions/constants/notification';
import * as SEND from 'actions/constants/send';
import * as BLOCKCHAIN from 'actions/constants/blockchain';
import { initialState } from 'reducers/SendFormRippleReducer';
import * as reducerUtils from 'reducers/utils';
import { fromDecimalAmount } from 'utils/formatUtils';

import type {
    Dispatch,
    GetState,
    State as ReducersState,
    Action,
    ThunkAction,
    AsyncAction,
    TrezorDevice,
} from 'flowtype';
import type { State, FeeLevel } from 'reducers/SendFormRippleReducer';
import * as SessionStorageActions from '../SessionStorageActions';

import * as BlockchainActions from './BlockchainActions';
import * as ValidationActions from './SendFormValidationActions';

/*
* Called from WalletService
*/
export const observe = (prevState: ReducersState, action: Action): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const currentState = getState();

    // if action type is SEND.VALIDATION which is called as result of this process
    // save data to session storage
    if (action.type === SEND.VALIDATION) {
        dispatch(SessionStorageActions.saveDraftTransaction());
        return;
    }

    // if send form was not initialized
    if (currentState.sendFormRipple.networkSymbol === '') {
        dispatch(init());
        return;
    }

    // handle gasPrice update from backend
    // recalculate fee levels if needed
    if (action.type === BLOCKCHAIN.UPDATE_FEE) {
        dispatch(ValidationActions.onFeeUpdated(action.shortcut, action.feeLevels));
        return;
    }

    let shouldUpdate: boolean = false;
    // check if "selectedAccount" reducer changed
    shouldUpdate = reducerUtils.observeChanges(prevState.selectedAccount, currentState.selectedAccount, {
        account: ['balance', 'sequence'],
    });

    // check if "sendForm" reducer changed
    if (!shouldUpdate) {
        shouldUpdate = reducerUtils.observeChanges(prevState.sendFormRipple, currentState.sendFormRipple);
    }

    if (shouldUpdate) {
        const validated = dispatch(ValidationActions.validation(prevState.sendFormRipple));
        dispatch({
            type: SEND.VALIDATION,
            networkType: 'ripple',
            state: validated,
        });
    }
};

/*
* Called from "observe" action
* Initialize "sendFormRipple" reducer data
* Get data either from session storage or "selectedAccount" reducer
*/
export const init = (): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const {
        account,
        network,
    } = getState().selectedAccount;

    if (!account || account.networkType !== 'ripple' || !network) return;

    const stateFromStorage = dispatch(SessionStorageActions.loadRippleDraftTransaction());
    if (stateFromStorage) {
        dispatch({
            type: SEND.INIT,
            networkType: 'ripple',
            state: stateFromStorage,
        });
        return;
    }

    const blockchainFeeLevels = dispatch(BlockchainActions.getFeeLevels(network));
    const feeLevels = dispatch(ValidationActions.getFeeLevels(blockchainFeeLevels));
    const selectedFeeLevel = ValidationActions.getSelectedFeeLevel(feeLevels, initialState.selectedFeeLevel);

    dispatch({
        type: SEND.INIT,
        networkType: 'ripple',
        state: {
            ...initialState,
            networkName: network.shortcut,
            networkSymbol: network.symbol,
            feeLevels,
            selectedFeeLevel,
            fee: network.fee.defaultFee,
            sequence: '1',
        },
    });
};

/*
* Called from UI from "advanced" button
*/
export const toggleAdvanced = (): Action => ({
    type: SEND.TOGGLE_ADVANCED,
    networkType: 'ripple',
});

/*
* Called from UI from "clear" button
*/
export const onClear = (): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const { network } = getState().selectedAccount;
    const { advanced } = getState().sendFormRipple;

    if (!network) return;

    // clear transaction draft from session storage
    dispatch(SessionStorageActions.clear());

    const blockchainFeeLevels = dispatch(BlockchainActions.getFeeLevels(network));
    const feeLevels = dispatch(ValidationActions.getFeeLevels(blockchainFeeLevels));
    const selectedFeeLevel = ValidationActions.getSelectedFeeLevel(feeLevels, initialState.selectedFeeLevel);

    dispatch({
        type: SEND.CLEAR,
        networkType: 'ripple',
        state: {
            ...initialState,
            networkName: network.shortcut,
            networkSymbol: network.symbol,
            feeLevels,
            selectedFeeLevel,
            fee: network.fee.defaultFee,
            sequence: '1',
            advanced,
        },
    });
};

/*
* Called from UI on "address" field change
*/
export const onAddressChange = (address: string): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const state: State = getState().sendFormRipple;
    dispatch({
        type: SEND.CHANGE,
        networkType: 'ripple',
        state: {
            ...state,
            untouched: false,
            touched: { ...state.touched, address: true },
            address,
        },
    });
};

/*
* Called from UI on "amount" field change
*/
export const onAmountChange = (amount: string): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const state = getState().sendFormRipple;
    dispatch({
        type: SEND.CHANGE,
        networkType: 'ripple',
        state: {
            ...state,
            untouched: false,
            touched: { ...state.touched, amount: true },
            setMax: false,
            amount,
        },
    });
};

/*
* Called from UI from "set max" button
*/
export const onSetMax = (): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const state = getState().sendFormRipple;
    dispatch({
        type: SEND.CHANGE,
        networkType: 'ripple',
        state: {
            ...state,
            untouched: false,
            touched: { ...state.touched, amount: true },
            setMax: !state.setMax,
        },
    });
};

/*
* Called from UI on "fee" selection change
*/
export const onFeeLevelChange = (feeLevel: FeeLevel): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const state = getState().sendFormRipple;

    const isCustom = feeLevel.value === 'Custom';
    const advanced = isCustom ? true : state.advanced;

    dispatch({
        type: SEND.CHANGE,
        networkType: 'ripple',
        state: {
            ...state,
            advanced,
            selectedFeeLevel: feeLevel,
            fee: isCustom ? state.selectedFeeLevel.fee : feeLevel.fee,
        },
    });
};

/*
* Called from UI from "update recommended fees" button
*/
export const updateFeeLevels = (): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const {
        account,
        network,
    } = getState().selectedAccount;
    if (!account || !network) return;

    const blockchainFeeLevels = dispatch(BlockchainActions.getFeeLevels(network));
    const state: State = getState().sendFormRipple;
    const feeLevels = dispatch(ValidationActions.getFeeLevels(blockchainFeeLevels, state.selectedFeeLevel));
    const selectedFeeLevel = ValidationActions.getSelectedFeeLevel(feeLevels, state.selectedFeeLevel);

    dispatch({
        type: SEND.CHANGE,
        networkType: 'ripple',
        state: {
            ...state,
            feeLevels,
            selectedFeeLevel,
            feeNeedsUpdate: false,
        },
    });
};

/*
* Called from UI on "advanced / fee" field change
*/
export const onFeeChange = (fee: string): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const { network } = getState().selectedAccount;
    if (!network) return;
    const state: State = getState().sendFormRipple;

    // switch to custom fee level
    let newSelectedFeeLevel = state.selectedFeeLevel;
    if (state.selectedFeeLevel.value !== 'Custom') newSelectedFeeLevel = state.feeLevels.find(f => f.value === 'Custom');

    dispatch({
        type: SEND.CHANGE,
        networkType: 'ripple',
        state: {
            ...state,
            untouched: false,
            touched: { ...state.touched, fee: true },
            selectedFeeLevel: newSelectedFeeLevel,
            fee,
        },
    });
};

/*
* Called from UI on "advanced / destination tag" field change
*/
export const onDestinationTagChange = (destinationTag: string): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const state: State = getState().sendFormRipple;
    dispatch({
        type: SEND.CHANGE,
        networkType: 'ripple',
        state: {
            ...state,
            untouched: false,
            touched: { ...state.touched, destinationTag: true },
            destinationTag,
        },
    });
};

/*
* Called from UI from "send" button
*/
export const onSend = (): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const {
        account,
        network,
    } = getState().selectedAccount;

    const selected: ?TrezorDevice = getState().wallet.selectedDevice;
    if (!selected) return;

    if (!account || account.networkType !== 'ripple' || !network) return;

    const blockchain = getState().blockchain.find(b => b.shortcut === account.network);
    if (!blockchain) return;

    const currentState: State = getState().sendFormRipple;
    const payment: { amount: string, destination: string, destinationTag?: number } = {
        amount: fromDecimalAmount(currentState.amount, network.decimals),
        destination: currentState.address,
    };
    if (currentState.destinationTag.length > 0) {
        payment.destinationTag = parseInt(currentState.destinationTag, 10);
    }

    const signedTransaction = await TrezorConnect.rippleSignTransaction({
        device: {
            path: selected.path,
            instance: selected.instance,
            state: selected.state,
        },
        useEmptyPassphrase: selected.useEmptyPassphrase,
        path: account.accountPath,
        transaction: {
            fee: currentState.selectedFeeLevel.fee, // Fee must be in the range of 10 to 10,000 drops
            flags: 0x80000000,
            sequence: account.sequence,
            payment,
        },
    });

    if (!signedTransaction || !signedTransaction.success) {
        dispatch({
            type: NOTIFICATION.ADD,
            payload: {
                type: 'error',
                title: 'Transaction error',
                message: signedTransaction.payload.error,
                cancelable: true,
                actions: [],
            },
        });
        return;
    }

    const push = await TrezorConnect.pushTransaction({
        tx: signedTransaction.payload.serializedTx,
        coin: network.shortcut,
    });

    if (!push.success) {
        dispatch({
            type: NOTIFICATION.ADD,
            payload: {
                type: 'error',
                title: 'Transaction error',
                message: push.payload.error,
                cancelable: true,
                actions: [],
            },
        });
        return;
    }

    const { txid } = push.payload;

    dispatch({ type: SEND.TX_COMPLETE });

    // clear session storage
    dispatch(SessionStorageActions.clear());

    // reset form
    dispatch(init());

    dispatch({
        type: NOTIFICATION.ADD,
        payload: {
            type: 'success',
            title: 'Transaction success',
            message: txid,
            cancelable: true,
            actions: [],
        },
    });
};

export default {
    toggleAdvanced,
    onAddressChange,
    onAmountChange,
    onSetMax,
    onFeeLevelChange,
    updateFeeLevels,
    onFeeChange,
    onDestinationTagChange,
    onSend,
    onClear,
};