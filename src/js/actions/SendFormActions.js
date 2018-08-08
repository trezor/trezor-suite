/* @flow */


import EthereumjsUtil from 'ethereumjs-util';
import EthereumjsUnits from 'ethereumjs-units';
import EthereumjsTx from 'ethereumjs-tx';
import TrezorConnect from 'trezor-connect';
import { push } from 'react-router-redux';
import BigNumber from 'bignumber.js';
import { strip } from '../utils/ethUtils';
import { estimateGas, getGasPrice, pushTx } from './Web3Actions';
import * as SessionStorageActions from './SessionStorageActions';
import * as NOTIFICATION from './constants/notification';
import * as SEND from './constants/send';

import { initialState } from '../reducers/SendFormReducer';
import { findAccount } from '../reducers/AccountsReducer';
import { findToken } from '../reducers/TokensReducer';
import { findDevice } from '../reducers/utils';
import * as stateUtils from '../reducers/utils';

import type {
    PendingTx,
    Dispatch,
    GetState,
    Action,
    ThunkAction,
    AsyncAction,
    RouterLocationState,
    TrezorDevice,
} from '~/flowtype';
import type { State as AccountState } from '../reducers/SelectedAccountReducer';
import type { Web3Instance } from '../reducers/Web3Reducer';
import type { Config, Coin } from '../reducers/LocalStorageReducer';
import type { Token } from '../reducers/TokensReducer';
import type { State, FeeLevel } from '../reducers/SendFormReducer';
import type { Account } from '../reducers/AccountsReducer';
import type { Props } from '../components/wallet/account/send';

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

export type SendFormAction = SendTxAction | {
    type: typeof SEND.INIT,
    state: State
} | {
    type: typeof SEND.DISPOSE
} | {
    type: typeof SEND.TOGGLE_ADVANCED
} | {
    type: typeof SEND.VALIDATION,
    errors: {[k: string]: string},
    warnings: {[k: string]: string},
    infos: {[k: string]: string}
} | {
    type: typeof SEND.ADDRESS_VALIDATION,
    state: State
} | {
    type: typeof SEND.ADDRESS_CHANGE,
    state: State
} | {
    type: typeof SEND.AMOUNT_CHANGE,
    state: State
} | {
    type: typeof SEND.CURRENCY_CHANGE,
    state: State
} | {
    type: typeof SEND.SET_MAX,
    state: State
} | {
    type: typeof SEND.FEE_LEVEL_CHANGE,
    state: State
} | {
    type: typeof SEND.UPDATE_FEE_LEVELS,
    state: State
} | {
    type: typeof SEND.FEE_LEVEL_CHANGE,
    state: State
} | {
    type: typeof SEND.GAS_PRICE_CHANGE,
    state: State
} | {
    type: typeof SEND.GAS_LIMIT_CHANGE,
    state: State
} | {
    type: typeof SEND.NONCE_CHANGE,
    state: State
} | {
    type: typeof SEND.DATA_CHANGE,
    state: State
} | {
    type: typeof SEND.SEND,
} | {
    type: typeof SEND.TX_ERROR,
} | {
    type: typeof SEND.FROM_SESSION_STORAGE,
    address: string,
    amount: string,
    setMax: boolean,
    selectedCurrency: string,
    selectedFeeLevel: any,
    advanced: boolean,
    gasLimit: string,
    gasPrice: string,
    data: string,
    nonce: string,
    touched: any,
}

//const numberRegExp = new RegExp('^([0-9]{0,10}\\.)?[0-9]{1,18}$');
const numberRegExp: RegExp = new RegExp('^(0|0\\.([0-9]+)?|[1-9][0-9]*\\.?([0-9]+)?|\\.[0-9]+)$');

export const calculateFee = (gasPrice: string, gasLimit: string): string => {
    try {
        return EthereumjsUnits.convert(new BigNumber(gasPrice).times(gasLimit), 'gwei', 'ether');
    } catch (error) {
        return '0';
    }
};

export const calculateTotal = (amount: string, gasPrice: string, gasLimit: string): string => {
    try {
        return new BigNumber(amount).plus(calculateFee(gasPrice, gasLimit)).toString(10);
    } catch (error) {
        return '0';
    }
};

export const calculateMaxAmount = (balance: BigNumber, gasPrice: string, gasLimit: string): string => {
    try {
        // TODO - minus pendings
        const fee = calculateFee(gasPrice, gasLimit);
        const max = balance.minus(fee);
        if (max.lessThan(0)) return '0';
        return max.toString(10);
    } catch (error) {
        return '0';
    }
};

export const calculate = (prevProps: Props, props: Props) => {
    const {
        account,
        tokens,
        pending,
    } = props.selectedAccount;
    if (!account) return;

    const prevState = prevProps.sendForm;
    const state = props.sendForm;
    const isToken: boolean = state.currency !== state.networkSymbol;

    // account balance
    // token balance
    // gasLimit, gasPrice changed

    // const shouldRecalculateAmount =
    //     (prevProps.selectedAccount.account !== account)
    //     || (prevProps.)


    if (state.setMax) {
        const pendingAmount: BigNumber = stateUtils.getPendingAmount(pending, state.currency, isToken);

        if (isToken) {
            const token: ?Token = findToken(tokens, account.address, state.currency, account.deviceState);
            if (token) {
                state.amount = new BigNumber(token.balance).minus(pendingAmount).toString(10);
            }
        } else {
            const b = new BigNumber(account.balance).minus(pendingAmount);
            state.amount = calculateMaxAmount(b, state.gasPrice, state.gasLimit);
        }
    }

    // amount changed
    // fee changed
    state.total = calculateTotal(isToken ? '0' : state.amount, state.gasPrice, state.gasLimit);

    if (state.selectedFeeLevel.value === 'Custom') {
        state.selectedFeeLevel.label = `${calculateFee(state.gasPrice, state.gasLimit)} ${state.networkSymbol}`;
        state.selectedFeeLevel.gasPrice = state.gasPrice;
    }
};


export const getFeeLevels = (symbol: string, gasPrice: BigNumber | string, gasLimit: string, selected?: FeeLevel): Array<FeeLevel> => {
    const price: BigNumber = typeof gasPrice === 'string' ? new BigNumber(gasPrice) : gasPrice;
    const quarter: BigNumber = price.dividedBy(4);
    const high: string = price.plus(quarter.times(2)).toString(10);
    const low: string = price.minus(quarter.times(2)).toString(10);

    const customLevel: FeeLevel = selected && selected.value === 'Custom' ? {
        value: 'Custom',
        gasPrice: selected.gasPrice,
        // label: `${ calculateFee(gasPrice, gasLimit) } ${ symbol }`
        label: `${calculateFee(selected.gasPrice, gasLimit)} ${symbol}`,
    } : {
        value: 'Custom',
        gasPrice: low,
        label: '',
    };

    return [
        {
            value: 'High',
            gasPrice: high,
            label: `${calculateFee(high, gasLimit)} ${symbol}`,
        },
        {
            value: 'Normal',
            gasPrice: gasPrice.toString(),
            label: `${calculateFee(price.toString(10), gasLimit)} ${symbol}`,
        },
        {
            value: 'Low',
            gasPrice: low,
            label: `${calculateFee(low, gasLimit)} ${symbol}`,
        },
        customLevel,
    ];
};


// initialize component
export const init = (): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const {
        account,
        network,
        web3,
    } = getState().selectedAccount;

    if (!account || !network || !web3) return;

    const stateFromStorage = SessionStorageActions.load(getState().router.location.pathname);
    if (stateFromStorage) {
        dispatch({
            type: SEND.INIT,
            state: stateFromStorage,
        });
        return;
    }

    // TODO: check if there are some unfinished tx in localStorage

    const gasPrice: BigNumber = new BigNumber(EthereumjsUnits.convert(web3.gasPrice, 'wei', 'gwei')) || new BigNumber(network.defaultGasPrice);
    const gasLimit: string = network.defaultGasLimit.toString();
    const feeLevels: Array<FeeLevel> = getFeeLevels(network.symbol, gasPrice, gasLimit);

    // TODO: get nonce
    //  TODO: LOAD DATA FROM SESSION STORAGE

    const state: State = {
        ...initialState,
        networkName: network.network,
        networkSymbol: network.symbol,
        currency: network.symbol,
        feeLevels,
        selectedFeeLevel: feeLevels.find(f => f.value === 'Normal'),
        recommendedGasPrice: gasPrice.toString(),
        gasLimit,
        gasPrice: gasPrice.toString(),
    };

    dispatch({
        type: SEND.INIT,
        state,
    });
};

export const toggleAdvanced = (address: string): Action => ({
    type: SEND.TOGGLE_ADVANCED,
});


const addressValidation = (): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const {
        account,
        network,
        tokens,
    } = getState().selectedAccount;
    if (!account || !network) return;

    const state: State = getState().sendForm;
    const infos = { ...state.infos };
    const warnings = { ...state.warnings };


    if (state.untouched || !state.touched.address) return;

    const savedAccounts = getState().accounts.filter(a => a.address.toLowerCase() === state.address.toLowerCase());
    if (savedAccounts.length > 0) {
        // check if found account belongs to this network
        // corner-case: when same derivation path is used on different networks
        const currentNetworkAccount = savedAccounts.find(a => a.network === network.network);
        if (currentNetworkAccount) {
            const device: ?TrezorDevice = findDevice(getState().devices, currentNetworkAccount.deviceID, currentNetworkAccount.deviceState);
            if (device) {
                infos.address = `${device.instanceLabel} Account #${(currentNetworkAccount.index + 1)}`;
            }
        } else {
            const otherNetworkAccount = savedAccounts[0];
            const device: ?TrezorDevice = findDevice(getState().devices, otherNetworkAccount.deviceID, otherNetworkAccount.deviceState);
            const coins = getState().localStorage.config.coins;
            const otherNetwork: ?Coin = coins.find(c => c.network === otherNetworkAccount.network);
            if (device && otherNetwork) {
                warnings.address = `Looks like it's ${device.instanceLabel} Account #${(otherNetworkAccount.index + 1)} address of ${otherNetwork.name} network`;
            }
        }
    } else {
        delete warnings.address;
        delete infos.address;
    }

    dispatch({
        type: SEND.ADDRESS_VALIDATION,
        state: {
            ...state,
            infos,
            warnings,
        },
    });
};


export const validation = (props: Props): void => {
    const {
        account,
        network,
        tokens,
        pending,
    } = props.selectedAccount;
    if (!account || !network) return;


    const state: State = props.sendForm;

    const errors: {[k: string]: string} = {};
    const warnings: {[k: string]: string} = {};
    const infos: {[k: string]: string} = {};

    if (state.untouched) return;
    // valid address
    if (state.touched.address) {
        if (state.address.length < 1) {
            errors.address = 'Address is not set';
        } else if (!EthereumjsUtil.isValidAddress(state.address)) {
            errors.address = 'Address is not valid';
        } else {
            // address warning or info are set in addressValidation ThunkAction
            // do not override this
            if (state.warnings.address) {
                warnings.address = state.warnings.address;
            } else if (state.infos.address) {
                infos.address = state.infos.address;
            }
        }
    }

    // valid amount
    // https://stackoverflow.com/a/42701461
    //const regexp = new RegExp('^(?:[0-9]{0,10}\\.)?[0-9]{1,18}$');
    if (state.touched.amount) {
        if (state.amount.length < 1) {
            errors.amount = 'Amount is not set';
        } else if (state.amount.length > 0 && !state.amount.match(numberRegExp)) {
            errors.amount = 'Amount is not a number';
        } else {
            let decimalRegExp: RegExp;
            const pendingAmount: BigNumber = stateUtils.getPendingAmount(pending, state.currency, state.currency !== state.networkSymbol);

            if (state.currency !== state.networkSymbol) {
                const token = findToken(tokens, account.address, state.currency, account.deviceState);
                if (token) {
                    if (parseInt(token.decimals) > 0) {
                        //decimalRegExp = new RegExp('^(0|0\\.([0-9]{0,' + token.decimals + '})?|[1-9]+\\.?([0-9]{0,' + token.decimals + '})?|\\.[0-9]{1,' + token.decimals + '})$');
                        decimalRegExp = new RegExp(`^(0|0\\.([0-9]{0,${token.decimals}})?|[1-9][0-9]*\\.?([0-9]{0,${token.decimals}})?|\\.[0-9]{1,${token.decimals}})$`);
                    } else {
                        // decimalRegExp = new RegExp('^(0|0\\.?|[1-9]+\\.?)$');
                        decimalRegExp = new RegExp('^[0-9]+$');
                    }

                    if (!state.amount.match(decimalRegExp)) {
                        errors.amount = `Maximum ${token.decimals} decimals allowed`;
                    } else if (new BigNumber(state.total).greaterThan(account.balance)) {
                        errors.amount = `Not enough ${state.networkSymbol} to cover transaction fee`;
                    } else if (new BigNumber(state.amount).greaterThan(new BigNumber(token.balance).minus(pendingAmount))) {
                        errors.amount = 'Not enough funds';
                    } else if (new BigNumber(state.amount).lessThanOrEqualTo('0')) {
                        errors.amount = 'Amount is too low';
                    }
                }
            } else {
                decimalRegExp = new RegExp('^(0|0\\.([0-9]{0,18})?|[1-9][0-9]*\\.?([0-9]{0,18})?|\\.[0-9]{0,18})$');
                if (!state.amount.match(decimalRegExp)) {
                    errors.amount = 'Maximum 18 decimals allowed';
                } else if (new BigNumber(state.total).greaterThan(new BigNumber(account.balance).minus(pendingAmount))) {
                    errors.amount = 'Not enough funds';
                }
            }
        }
    }

    // valid gas limit
    if (state.touched.gasLimit) {
        if (state.gasLimit.length < 1) {
            errors.gasLimit = 'Gas limit is not set';
        } else if (state.gasLimit.length > 0 && !state.gasLimit.match(numberRegExp)) {
            errors.gasLimit = 'Gas limit is not a number';
        } else {
            const gl: BigNumber = new BigNumber(state.gasLimit);
            if (gl.lessThan(1)) {
                errors.gasLimit = 'Gas limit is too low';
            } else if (gl.lessThan(state.currency !== state.networkSymbol ? network.defaultGasLimitTokens : network.defaultGasLimit)) {
                warnings.gasLimit = 'Gas limit is below recommended';
            }
        }
    }

    // valid gas price
    if (state.touched.gasPrice) {
        if (state.gasPrice.length < 1) {
            errors.gasPrice = 'Gas price is not set';
        } else if (state.gasPrice.length > 0 && !state.gasPrice.match(numberRegExp)) {
            errors.gasPrice = 'Gas price is not a number';
        } else {
            const gp: BigNumber = new BigNumber(state.gasPrice);
            if (gp.greaterThan(1000)) {
                warnings.gasPrice = 'Gas price is too high';
            } else if (gp.lessThanOrEqualTo('0')) {
                errors.gasPrice = 'Gas price is too low';
            }
        }
    }

    // valid nonce
    if (state.touched.nonce) {
        const re = new RegExp('^[0-9]+$');
        if (state.nonce.length < 1) {
            errors.nonce = 'Nonce is not set';
        } else if (!state.nonce.match(re)) {
            errors.nonce = 'Nonce is not a valid number';
        } else {
            const n: BigNumber = new BigNumber(state.nonce);
            if (n.lessThan(account.nonce)) {
                warnings.nonce = 'Nonce is lower than recommended';
            } else if (n.greaterThan(account.nonce)) {
                warnings.nonce = 'Nonce is greater than recommended';
            }
        }
    }

    // valid data
    if (state.touched.data && state.data.length > 0) {
        const re = /^[0-9A-Fa-f]+$/g;
        if (!re.test(state.data)) {
            errors.data = 'Data is not valid hexadecimal';
        }
    }

    // valid nonce?

    state.errors = errors;
    state.warnings = warnings;
    state.infos = infos;
};


export const onAddressChange = (address: string): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const state: State = getState().sendForm;
    const touched = { ...state.touched };
    touched.address = true;

    dispatch({
        type: SEND.ADDRESS_CHANGE,
        state: {
            ...state,
            untouched: false,
            touched,
            address,
        },
    });

    dispatch(addressValidation());
};

export const onAmountChange = (amount: string): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const state = getState().sendForm;
    const touched = { ...state.touched };
    touched.amount = true;

    dispatch({
        type: SEND.AMOUNT_CHANGE,
        state: {
            ...state,
            untouched: false,
            touched,
            setMax: false,
            amount,
        },
    });
};

export const onCurrencyChange = (currency: { value: string, label: string }): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const {
        account,
        network,
    } = getState().selectedAccount;
    if (!account || !network) return;

    const currentState: State = getState().sendForm;
    const isToken: boolean = currency.value !== currentState.networkSymbol;
    const gasLimit: string = isToken ? network.defaultGasLimitTokens.toString() : network.defaultGasLimit.toString();

    const feeLevels: Array<FeeLevel> = getFeeLevels(network.symbol, currentState.recommendedGasPrice, gasLimit, currentState.selectedFeeLevel);
    const selectedFeeLevel: ?FeeLevel = feeLevels.find(f => f.value === currentState.selectedFeeLevel.value);
    if (!selectedFeeLevel) return;

    const state: State = {
        ...currentState,
        currency: currency.value,
        // amount,
        // total,
        feeLevels,
        selectedFeeLevel,
        gasLimit,
    };

    dispatch({
        type: SEND.CURRENCY_CHANGE,
        state,
    });
};

export const onSetMax = (): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const state = getState().sendForm;
    const touched = { ...state.touched };
    touched.amount = true;

    dispatch({
        type: SEND.SET_MAX,
        state: {
            ...state,
            untouched: false,
            touched,
            setMax: !state.setMax,
        },
    });
};

export const onFeeLevelChange = (feeLevel: FeeLevel): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const {
        network,
    } = getState().selectedAccount;
    if (!network) return;

    const currentState: State = getState().sendForm;
    const isToken: boolean = currentState.currency !== currentState.networkSymbol;

    const state: State = {
        ...currentState,
        untouched: false,
        selectedFeeLevel: feeLevel,
    };

    if (feeLevel.value === 'Custom') {
        state.advanced = true;
        feeLevel.gasPrice = state.gasPrice;
        feeLevel.label = `${calculateFee(state.gasPrice, state.gasLimit)} ${state.networkSymbol}`;
    } else {
        const customLevel: ?FeeLevel = state.feeLevels.find(f => f.value === 'Custom');
        if (customLevel) customLevel.label = '';
        state.gasPrice = feeLevel.gasPrice;
        if (isToken) {
            state.gasLimit = network.defaultGasLimitTokens.toString();
        } else {
            state.gasLimit = state.data.length > 0 ? state.gasLimit : network.defaultGasLimit.toString();
        }
    }

    dispatch({
        type: SEND.FEE_LEVEL_CHANGE,
        state,
    });
};

// Manually triggered from user
// Update gasPrice to recommended value

export const updateFeeLevels = (): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const {
        account,
        network,
    } = getState().selectedAccount;
    if (!account || !network) return;

    const currentState: State = getState().sendForm;
    const isToken: boolean = currentState.currency !== currentState.networkSymbol;
    let gasLimit: string = isToken ? network.defaultGasLimitTokens.toString() : network.defaultGasLimit.toString();

    // override custom settings
    if (currentState.selectedFeeLevel.value === 'Custom') {
        // update only gasPrice
        currentState.selectedFeeLevel.gasPrice = currentState.recommendedGasPrice;
        // leave gas limit as it was
        gasLimit = currentState.gasLimit;
    }

    const feeLevels: Array<FeeLevel> = getFeeLevels(network.symbol, currentState.recommendedGasPrice, gasLimit, currentState.selectedFeeLevel);
    const selectedFeeLevel: ?FeeLevel = feeLevels.find(f => f.value === currentState.selectedFeeLevel.value);
    if (!selectedFeeLevel) return;

    const state: State = {
        ...currentState,
        feeLevels,
        selectedFeeLevel,
        gasPrice: selectedFeeLevel.gasPrice,
        gasPriceNeedsUpdate: false,
    };

    dispatch({
        type: SEND.UPDATE_FEE_LEVELS,
        state,
    });
};

export const onGasPriceChange = (gasPrice: string): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const currentState: State = getState().sendForm;
    const isToken: boolean = currentState.currency !== currentState.networkSymbol;

    const touched = { ...currentState.touched };
    touched.gasPrice = true;

    const state: State = {
        ...currentState,
        untouched: false,
        touched,
        gasPrice,
    };

    if (currentState.selectedFeeLevel.value !== 'Custom') {
        const customLevel = currentState.feeLevels.find(f => f.value === 'Custom');
        if (!customLevel) return;
        state.selectedFeeLevel = customLevel;
    }

    dispatch({
        type: SEND.GAS_PRICE_CHANGE,
        state,
    });
};

export const onGasLimitChange = (gasLimit: string, updateFeeLevels: boolean = false): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const currentState: State = getState().sendForm;
    const isToken: boolean = currentState.currency !== currentState.networkSymbol;

    const touched = { ...currentState.touched };
    touched.gasLimit = true;

    const state: State = {
        ...currentState,
        calculatingGasLimit: false,
        untouched: false,
        touched,
        gasLimit,
    };

    if (currentState.selectedFeeLevel.value !== 'Custom') {
        const customLevel = currentState.feeLevels.find(f => f.value === 'Custom');
        if (!customLevel) return;
        state.selectedFeeLevel = customLevel;
    }

    dispatch({
        type: SEND.GAS_LIMIT_CHANGE,
        state,
    });
};

export const onNonceChange = (nonce: string): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const currentState: State = getState().sendForm;
    const touched = { ...currentState.touched };
    touched.nonce = true;

    const state: State = {
        ...currentState,
        untouched: false,
        touched,
        nonce,
    };

    dispatch({
        type: SEND.NONCE_CHANGE,
        state,
    });
};

export const onDataChange = (data: string): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const currentState: State = getState().sendForm;
    const touched = { ...currentState.touched };
    touched.data = true;

    const state: State = {
        ...currentState,
        calculatingGasLimit: true,
        untouched: false,
        touched,
        data,
    };

    if (currentState.selectedFeeLevel.value !== 'Custom') {
        const customLevel = currentState.feeLevels.find(f => f.value === 'Custom');
        if (!customLevel) return;
        state.selectedFeeLevel = customLevel;
    }

    dispatch({
        type: SEND.DATA_CHANGE,
        state,
    });

    dispatch(estimateGasPrice());
};


const estimateGasPrice = (): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const {
        web3,
        network,
    } = getState().selectedAccount;
    if (!web3 || !network) return;

    const w3 = web3.web3;

    const state: State = getState().sendForm;
    const requestedData = state.data;

    const re = /^[0-9A-Fa-f]+$/g;
    if (!re.test(requestedData)) {
        // to stop calculating
        dispatch(onGasLimitChange(requestedData.length > 0 ? state.gasLimit : network.defaultGasLimit.toString()));
        return;
    }

    if (state.data.length < 1) {
        // set default
        dispatch(onGasLimitChange(network.defaultGasLimit.toString()));
        return;
    }

    // TODO: allow data starting with 0x ...
    const data: string = `0x${state.data.length % 2 === 0 ? state.data : `0${state.data}`}`;
    const gasLimit = await estimateGas(w3, {
        to: '0x0000000000000000000000000000000000000000',
        data,
        value: w3.toHex(w3.toWei(state.amount, 'ether')),
        gasPrice: w3.toHex(EthereumjsUnits.convert(state.gasPrice, 'gwei', 'wei')),
    });

    if (getState().sendForm.data === requestedData) {
        dispatch(onGasLimitChange(gasLimit.toString()));
    }
};

export const onSend = (): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const {
        account,
        network,
        web3,
        pending,
    } = getState().selectedAccount;
    if (!account || !web3 || !network) return;

    const currentState: State = getState().sendForm;

    const isToken: boolean = currentState.currency !== currentState.networkSymbol;
    const w3 = web3.web3;

    const address_n = account.addressPath;

    let data: string = `0x${currentState.data}`;
    let txAmount: string = w3.toHex(w3.toWei(currentState.amount, 'ether'));
    let txAddress: string = currentState.address;
    if (isToken) {
        const token: ?Token = findToken(getState().tokens, account.address, currentState.currency, account.deviceState);
        if (!token) return;

        const contract = web3.erc20.at(token.address);
        const amountValue: string = new BigNumber(currentState.amount).times(Math.pow(10, token.decimals)).toString(10);

        data = contract.transfer.getData(currentState.address, amountValue, {
            from: account.address,
            gasLimit: currentState.gasLimit,
            gasPrice: currentState.gasPrice,
        });
        txAmount = '0x00';
        txAddress = token.address;
    }

    const pendingNonce: number = stateUtils.getPendingNonce(pending);
    const nonce = pendingNonce > 0 && pendingNonce >= account.nonce ? pendingNonce : account.nonce;

    console.warn('NONCE', nonce, account.nonce, pendingNonce);

    const txData = {
        address_n,
        // from: currentAddress.address
        to: txAddress,
        value: txAmount,
        data,
        chainId: web3.chainId,
        nonce: w3.toHex(nonce),
        gasLimit: w3.toHex(currentState.gasLimit),
        gasPrice: w3.toHex(EthereumjsUnits.convert(currentState.gasPrice, 'gwei', 'wei')),
        r: '',
        s: '',
        v: '',
    };

    const selected: ?TrezorDevice = getState().wallet.selectedDevice;
    if (!selected) return;

    const signedTransaction = await TrezorConnect.ethereumSignTransaction({
        device: {
            path: selected.path,
            instance: selected.instance,
            state: selected.state,
        },
        useEmptyPassphrase: !selected.instance,
        path: address_n,
        transaction: txData
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
        const tx = new EthereumjsTx(txData);
        const serializedTx = `0x${tx.serialize().toString('hex')}`;
        const txid: string = await pushTx(w3, serializedTx);

        dispatch({
            type: SEND.TX_COMPLETE,
            account,
            selectedCurrency: currentState.currency,
            amount: currentState.amount,
            total: currentState.total,
            tx,
            nonce,
            txid,
            txData,
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
                message: `<a href="${network.explorer.tx}${txid}" class="green" target="_blank" rel="noreferrer noopener">See transaction detail</a>`,
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
    onNonceChange,
    onDataChange,
    onSend,
};