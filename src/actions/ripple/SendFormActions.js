/* @flow */
import React from 'react';
import Link from 'components/Link';
import TrezorConnect from 'trezor-connect';
import * as NOTIFICATION from 'actions/constants/notification';
import * as SEND from 'actions/constants/send';
import * as WEB3 from 'actions/constants/web3';
import { initialState } from 'reducers/SendFormRippleReducer';
import * as reducerUtils from 'reducers/utils';
import * as ethUtils from 'utils/ethUtils';

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
import type { Account } from 'reducers/AccountsReducer';
import * as SessionStorageActions from '../SessionStorageActions';
import * as BlockchainActions from '../BlockchainActions';

import * as ValidationActions from './SendFormValidationActions';

export type SendTxAction = {
    type: typeof SEND.TX_COMPLETE,
    account: Account,
    selectedCurrency: string,
    amount: string,
    total: string,
    tx: any,
    nonce: number,
    txid: string,
    txData: any,
};

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
        console.warn("i should init myself!")
        dispatch(init());
        return;
    }

    // handle gasPrice update from backend
    // recalculate fee levels if needed
    if (action.type === WEB3.GAS_PRICE_UPDATED) {
        dispatch(ValidationActions.onGasPriceUpdated(action.network, action.gasPrice));
        return;
    }

    let shouldUpdate: boolean = false;
    // check if "selectedAccount" reducer changed
    shouldUpdate = reducerUtils.observeChanges(prevState.selectedAccount, currentState.selectedAccount, {
        account: ['balance', 'nonce'],
    });

    // check if "sendForm" reducer changed
    if (!shouldUpdate) {
        shouldUpdate = reducerUtils.observeChanges(prevState.sendFormRipple, currentState.sendFormRipple);
    }

    if (shouldUpdate) {
        const validated = dispatch(ValidationActions.validation());
        dispatch({
            type: SEND.VALIDATION,
            networkType: 'ripple',
            state: validated,
        });
    }
};

/*
* Called from "observe" action
* Initialize "sendForm" reducer data
* Get data either from session storage or "selectedAccount" reducer
*/
export const init = (): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const {
        account,
        network,
    } = getState().selectedAccount;

    if (!account || !network) return;

    const stateFromStorage = dispatch(SessionStorageActions.loadDraftTransaction());
    if (stateFromStorage) {
        // TODO: consider if current gasPrice should be set here as "recommendedGasPrice"
        dispatch({
            type: SEND.INIT,
            networkType: 'ripple',
            state: stateFromStorage,
        });
        return;
    }

    const feeLevels = ValidationActions.getFeeLevels(network.symbol, '1', '1');
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
            sequence: '1',
        },
    });
};

/*
* Called from UI from "advanced" button
*/
export const toggleAdvanced = (): Action => ({
    type: SEND.TOGGLE_ADVANCED,
});

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
    let newGasLimit = state.gasLimit;
    let newGasPrice = state.gasPrice;
    const advanced = isCustom ? true : state.advanced;

    if (!isCustom) {
        // if selected fee is not custom
        // update gasLimit to default and gasPrice to selected value
        const { network } = getState().selectedAccount;
        if (!network) return;
        const isToken = state.currency !== state.networkSymbol;
        if (isToken) {
            newGasLimit = network.defaultGasLimitTokens.toString();
        } else {
            // corner case: gas limit was changed by user OR by "estimateGasPrice" action
            // leave gasLimit as it is
            newGasLimit = state.touched.gasLimit ? state.gasLimit : network.defaultGasLimit.toString();
        }
        newGasPrice = feeLevel.gasPrice;
    }

    dispatch({
        type: SEND.CHANGE,
        networkType: 'ripple',
        state: {
            ...state,
            advanced,
            selectedFeeLevel: feeLevel,
            gasLimit: newGasLimit,
            gasPrice: newGasPrice,
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

    const state: State = getState().sendFormRipple;
    const feeLevels = ValidationActions.getFeeLevels(network.symbol, state.recommendedGasPrice, state.gasLimit, state.selectedFeeLevel);
    const selectedFeeLevel = ValidationActions.getSelectedFeeLevel(feeLevels, state.selectedFeeLevel);

    dispatch({
        type: SEND.CHANGE,
        networkType: 'ripple',
        state: {
            ...state,
            feeLevels,
            selectedFeeLevel,
            gasPrice: selectedFeeLevel.gasPrice,
            gasPriceNeedsUpdate: false,
        },
    });
};

/*
* Called from UI on "gas price" field change
*/
export const onGasPriceChange = (gasPrice: string): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
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
            touched: { ...state.touched, gasPrice: true },
            gasPrice,
            selectedFeeLevel: newSelectedFeeLevel,
        },
    });
};

/*
* Called from UI on "data" field change
* OR from "estimateGasPrice" action
*/
export const onGasLimitChange = (gasLimit: string): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const { network } = getState().selectedAccount;
    if (!network) return;
    const state: State = getState().sendFormRipple;
    // recalculate feeLevels with recommended gasPrice
    const feeLevels = ValidationActions.getFeeLevels(network.symbol, state.recommendedGasPrice, gasLimit, state.selectedFeeLevel);
    const selectedFeeLevel = ValidationActions.getSelectedFeeLevel(feeLevels, state.selectedFeeLevel);

    dispatch({
        type: SEND.CHANGE,
        networkType: 'ripple',
        state: {
            ...state,
            calculatingGasLimit: false,
            untouched: false,
            touched: { ...state.touched, gasLimit: true },
            gasLimit,
            feeLevels,
            selectedFeeLevel,
        },
    });
};

/*
* Called from UI on "nonce" field change
*/
export const onNonceChange = (nonce: string): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const state: State = getState().sendFormRipple;
    dispatch({
        type: SEND.CHANGE,
        networkType: 'ripple',
        state: {
            ...state,
            untouched: false,
            touched: { ...state.touched, nonce: true },
            nonce,
        },
    });
};

/*
* Called from UI on "data" field change
*/
export const onDataChange = (data: string): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const state: State = getState().sendFormRipple;
    dispatch({
        type: SEND.CHANGE,
        networkType: 'ripple',
        state: {
            ...state,
            calculatingGasLimit: true,
            untouched: false,
            touched: { ...state.touched, data: true },
            data,
        },
    });

    dispatch(estimateGasPrice());
};

/*
* Internal method
* Called from "onDataChange" action
* try to asynchronously download data from backend
*/
const estimateGasPrice = (): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const state: State = getState().sendFormRipple;
    const { network } = getState().selectedAccount;
    if (!network) {
        // stop "calculatingGasLimit" process
        dispatch(onGasLimitChange(state.gasLimit));
        return;
    }

    const requestedData = state.data;
    if (!ethUtils.isHex(requestedData)) {
        // stop "calculatingGasLimit" process
        dispatch(onGasLimitChange(requestedData.length > 0 ? state.gasLimit : network.defaultGasLimit.toString()));
        return;
    }

    if (state.data.length < 1) {
        // set default
        dispatch(onGasLimitChange(network.defaultGasLimit.toString()));
        return;
    }

    const gasLimit = await dispatch(BlockchainActions.estimateGasLimit(network.shortcut, state.data, state.amount, state.gasPrice));

    // double check "data" field
    // possible race condition when data changed before backend respond
    if (getState().sendFormRipple.data === requestedData) {
        dispatch(onGasLimitChange(gasLimit));
    }
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

    if (!account || !network) return;

    const currentState: State = getState().sendFormRipple;

    const signedTransaction = await TrezorConnect.rippleSignTransaction({
        device: {
            path: selected.path,
            instance: selected.instance,
            state: selected.state,
        },
        useEmptyPassphrase: selected.useEmptyPassphrase,
        path: account.addressPath,
        transaction: {
            fee: '100000',
            flags: 0x80000000,
            sequence: account.nonce,
            payment: {
                amount: currentState.amount,
                destination: currentState.address,
            },
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

    dispatch({
        type: SEND.TX_COMPLETE,
        account,
        selectedCurrency: currentState.currency,
        amount: currentState.amount,
        total: currentState.total,
        tx: {},
        nonce: account.nonce,
        txid,
        txData: {},
    });

    // clear session storage
    dispatch(SessionStorageActions.clear());

    // reset form
    dispatch(init());

    dispatch({
        type: NOTIFICATION.ADD,
        payload: {
            type: 'success',
            title: 'Transaction success',
            message: <Link href={`${network.explorer.tx}${txid}`} isGreen>See transaction detail</Link>,
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
    onGasPriceChange,
    onGasLimitChange,
    onNonceChange,
    onDataChange,
    onSend,
};