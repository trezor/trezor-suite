/* @flow */
import React from 'react';
import Link from 'components/Link';
import TrezorConnect from 'trezor-connect';
import BigNumber from 'bignumber.js';
import * as ACCOUNT from 'actions/constants/account';
import * as NOTIFICATION from 'actions/constants/notification';
import * as SEND from 'actions/constants/send';
import * as WEB3 from 'actions/constants/web3';
import { initialState } from 'reducers/SendFormEthereumReducer';
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
import type { State, FeeLevel } from 'reducers/SendFormEthereumReducer';
import * as SessionStorageActions from '../SessionStorageActions';
import { prepareEthereumTx, serializeEthereumTx } from '../TxActions';
import * as BlockchainActions from './BlockchainActions';

import * as ValidationActions from './SendFormValidationActions';

// list of all actions which has influence on "sendFormEthereum" reducer
// other actions will be ignored
const actions = [
    ACCOUNT.UPDATE_SELECTED_ACCOUNT,
    WEB3.GAS_PRICE_UPDATED,
    ...Object.values(SEND).filter(v => typeof v === 'string'),
];

/*
* Called from WalletService
*/
export const observe = (prevState: ReducersState, action: Action): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    // ignore not listed actions
    if (actions.indexOf(action.type) < 0) return;

    const currentState = getState();
    // do not proceed if it's not "send" url
    if (!currentState.router.location.state.send) return;

    // if action type is SEND.VALIDATION which is called as result of this process
    // save data to session storage
    if (action.type === SEND.VALIDATION) {
        dispatch(SessionStorageActions.saveDraftTransaction());
        return;
    }

    // if send form was not initialized
    if (currentState.sendFormEthereum.currency === '') {
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
        account: ['balance', 'nonce', 'tokens'],
    });
    if (shouldUpdate && currentState.sendFormEthereum.currency !== currentState.sendFormEthereum.networkSymbol) {
        // make sure that this token is added into account
        const { account, tokens } = getState().selectedAccount;
        if (!account) return;
        const token = reducerUtils.findToken(tokens, account.descriptor, currentState.sendFormEthereum.currency, account.deviceState);
        if (!token) {
            // token not found, re-init form
            dispatch(init());
            return;
        }
    }

    // check if "sendFormEthereum" reducer changed
    if (!shouldUpdate) {
        shouldUpdate = reducerUtils.observeChanges(prevState.sendFormEthereum, currentState.sendFormEthereum);
    }

    if (shouldUpdate) {
        const validated = dispatch(ValidationActions.validation());
        dispatch({
            type: SEND.VALIDATION,
            networkType: 'ethereum',
            state: validated,
        });
    }
};

/*
* Called from "observe" action
* Initialize "sendFormEthereum" reducer data
* Get data either from session storage or "selectedAccount" reducer
*/
export const init = (): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const {
        account,
        network,
    } = getState().selectedAccount;

    if (!account || !network) return;

    const stateFromStorage = dispatch(SessionStorageActions.loadEthereumDraftTransaction());
    if (stateFromStorage) {
        // TODO: consider if current gasPrice should be set here as "recommendedGasPrice"
        dispatch({
            type: SEND.INIT,
            networkType: 'ethereum',
            state: stateFromStorage,
        });
        return;
    }

    const gasPrice: BigNumber = await dispatch(BlockchainActions.getGasPrice(network.shortcut, network.defaultGasPrice));
    const gasLimit = network.defaultGasLimit.toString();
    const feeLevels = ValidationActions.getFeeLevels(network.symbol, gasPrice, gasLimit);
    const selectedFeeLevel = ValidationActions.getSelectedFeeLevel(feeLevels, initialState.selectedFeeLevel);

    dispatch({
        type: SEND.INIT,
        networkType: 'ethereum',
        state: {
            ...initialState,
            networkName: network.shortcut,
            networkSymbol: network.symbol,
            currency: network.symbol,
            feeLevels,
            selectedFeeLevel,
            recommendedGasPrice: gasPrice.toString(),
            gasLimit,
            gasPrice: gasPrice.toString(),
        },
    });
};

/*
* Called from UI from "advanced" button
*/
export const toggleAdvanced = (): Action => ({
    type: SEND.TOGGLE_ADVANCED,
    networkType: 'ethereum',
});

/*
* Called from UI from "clear" button
*/
export const onClear = (): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const { network } = getState().selectedAccount;
    const { advanced } = getState().sendFormEthereum;

    if (!network) return;

    // clear transaction draft from session storage
    dispatch(SessionStorageActions.clear());

    const gasPrice: BigNumber = await dispatch(BlockchainActions.getGasPrice(network.shortcut, network.defaultGasPrice));
    const gasLimit = network.defaultGasLimit.toString();
    const feeLevels = ValidationActions.getFeeLevels(network.symbol, gasPrice, gasLimit);
    const selectedFeeLevel = ValidationActions.getSelectedFeeLevel(feeLevels, initialState.selectedFeeLevel);

    dispatch({
        type: SEND.CLEAR,
        networkType: 'ethereum',
        state: {
            ...initialState,
            networkName: network.shortcut,
            networkSymbol: network.symbol,
            currency: network.symbol,
            feeLevels,
            selectedFeeLevel,
            recommendedGasPrice: gasPrice.toString(),
            gasLimit,
            gasPrice: gasPrice.toString(),
            advanced,
        },
    });
};

/*
* Called from UI on "address" field change
*/
export const onAddressChange = (address: string): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const state: State = getState().sendFormEthereum;
    dispatch({
        type: SEND.CHANGE,
        networkType: 'ethereum',
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
    const state = getState().sendFormEthereum;
    dispatch({
        type: SEND.CHANGE,
        networkType: 'ethereum',
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
* Called from UI on "currency" selection change
*/
export const onCurrencyChange = (currency: { value: string, label: string }): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const {
        account,
        network,
    } = getState().selectedAccount;
    if (!account || !network) return;

    const state = getState().sendFormEthereum;

    const isToken = currency.value !== state.networkSymbol;
    const gasLimit = isToken ? network.defaultGasLimitTokens.toString() : network.defaultGasLimit.toString();

    const feeLevels = ValidationActions.getFeeLevels(network.symbol, state.recommendedGasPrice, gasLimit, state.selectedFeeLevel);
    const selectedFeeLevel = ValidationActions.getSelectedFeeLevel(feeLevels, state.selectedFeeLevel);

    dispatch({
        type: SEND.CHANGE,
        networkType: 'ethereum',
        state: {
            ...state,
            currency: currency.value,
            feeLevels,
            selectedFeeLevel,
            gasLimit,
        },
    });
};

/*
* Called from UI from "set max" button
*/
export const onSetMax = (): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const state = getState().sendFormEthereum;
    dispatch({
        type: SEND.CHANGE,
        networkType: 'ethereum',
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
    const state = getState().sendFormEthereum;

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
        networkType: 'ethereum',
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

    const state: State = getState().sendFormEthereum;
    const feeLevels = ValidationActions.getFeeLevels(network.symbol, state.recommendedGasPrice, state.gasLimit, state.selectedFeeLevel);
    const selectedFeeLevel = ValidationActions.getSelectedFeeLevel(feeLevels, state.selectedFeeLevel);

    dispatch({
        type: SEND.CHANGE,
        networkType: 'ethereum',
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
    const state: State = getState().sendFormEthereum;
    // switch to custom fee level
    let newSelectedFeeLevel = state.selectedFeeLevel;
    if (state.selectedFeeLevel.value !== 'Custom') newSelectedFeeLevel = state.feeLevels.find(f => f.value === 'Custom');

    dispatch({
        type: SEND.CHANGE,
        networkType: 'ethereum',
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
    const state: State = getState().sendFormEthereum;
    // recalculate feeLevels with recommended gasPrice
    const feeLevels = ValidationActions.getFeeLevels(network.symbol, state.recommendedGasPrice, gasLimit, state.selectedFeeLevel);
    const selectedFeeLevel = ValidationActions.getSelectedFeeLevel(feeLevels, state.selectedFeeLevel);

    dispatch({
        type: SEND.CHANGE,
        networkType: 'ethereum',
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
    const state: State = getState().sendFormEthereum;
    dispatch({
        type: SEND.CHANGE,
        networkType: 'ethereum',
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
    const state: State = getState().sendFormEthereum;
    dispatch({
        type: SEND.CHANGE,
        networkType: 'ethereum',
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

export const setDefaultGasLimit = (): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const state: State = getState().sendFormEthereum;
    const { network } = getState().selectedAccount;
    if (!network) return;

    const isToken = state.currency !== state.networkSymbol;
    const gasLimit = isToken ? network.defaultGasLimitTokens.toString() : network.defaultGasLimit.toString();

    dispatch({
        type: SEND.CHANGE,
        networkType: 'ethereum',
        state: {
            ...state,
            calculatingGasLimit: false,
            untouched: false,
            touched: { ...state.touched, gasLimit: false },
            gasLimit,
        },
    });
};

/*
* Internal method
* Called from "onDataChange" action
* try to asynchronously download data from backend
*/
const estimateGasPrice = (): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const state: State = getState().sendFormEthereum;
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
    if (getState().sendFormEthereum.data === requestedData) {
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
        pending,
    } = getState().selectedAccount;

    if (!account || account.networkType !== 'ethereum' || !network) return;

    const currentState: State = getState().sendFormEthereum;

    const isToken: boolean = currentState.currency !== currentState.networkSymbol;
    const pendingNonce: number = reducerUtils.getPendingSequence(pending);
    const nonce = pendingNonce > 0 && pendingNonce >= account.nonce ? pendingNonce : account.nonce;

    const txData = await dispatch(prepareEthereumTx({
        network: network.shortcut,
        token: isToken ? reducerUtils.findToken(getState().tokens, account.descriptor, currentState.currency, account.deviceState) : null,
        from: account.descriptor,
        to: currentState.address,
        amount: currentState.amount,
        data: currentState.data,
        gasLimit: currentState.gasLimit,
        gasPrice: currentState.gasPrice,
        nonce,
    }));

    const selected: ?TrezorDevice = getState().wallet.selectedDevice;
    if (!selected) return;

    const signedTransaction = await TrezorConnect.ethereumSignTransaction({
        device: {
            path: selected.path,
            instance: selected.instance,
            state: selected.state,
        },
        // useEmptyPassphrase: !selected.instance,
        useEmptyPassphrase: selected.useEmptyPassphrase,
        path: account.accountPath,
        transaction: txData,
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

    txData.r = signedTransaction.payload.r;
    txData.s = signedTransaction.payload.s;
    txData.v = signedTransaction.payload.v;

    try {
        const serializedTx: string = await dispatch(serializeEthereumTx(txData));
        const push = await TrezorConnect.pushTransaction({
            tx: serializedTx,
            coin: network.shortcut,
        });

        if (!push.success) {
            throw new Error(push.payload.error);
        }

        const { txid } = push.payload;

        dispatch({ type: SEND.TX_COMPLETE });

        // ugly blockbook workaround:
        // since blockbook can't emit pending notifications
        // need to trigger this event from here, where we know everything about this transaction
        // blockchainNotification is 'trezor-connect' BlockchainLinkTransaction type
        const fee = ValidationActions.calculateFee(currentState.gasLimit, currentState.gasPrice);
        const blockchainNotification = {
            type: 'send',
            descriptor: account.descriptor,
            inputs: [
                {
                    addresses: [account.descriptor],
                    amount: currentState.amount,
                    fee,
                    total: currentState.total,
                },
            ],
            outputs: [
                {
                    addresses: [currentState.address],
                    amount: currentState.amount,
                },
            ],
            hash: txid,
            amount: currentState.amount,
            fee,
            total: currentState.total,

            sequence: nonce,
            tokens: isToken ? [{
                name: currentState.currency,
                shortcut: currentState.currency,
                value: currentState.amount,
            }] : undefined,

            blockHeight: 0,
            blockHash: undefined,
            timestamp: undefined,
        };

        dispatch(BlockchainActions.onNotification({
            // $FlowIssue: missing coinInfo declaration
            coin: {},
            notification: blockchainNotification,
        }));
        // workaround end

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
    } catch (error) {
        dispatch({
            type: NOTIFICATION.ADD,
            payload: {
                type: 'error',
                title: 'Transaction error',
                message: error.message || error,
                cancelable: true,
                actions: [],
            },
        });
    }
};

export default {
    toggleAdvanced,
    onAddressChange,
    onAmountChange,
    onCurrencyChange,
    onSetMax,
    onFeeLevelChange,
    updateFeeLevels,
    onGasPriceChange,
    onGasLimitChange,
    setDefaultGasLimit,
    onNonceChange,
    onDataChange,
    onSend,
    onClear,
};