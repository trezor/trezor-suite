/* @flow */

import BigNumber from 'bignumber.js';
import EthereumjsUtil from 'ethereumjs-util';
import EthereumjsUnits from 'ethereumjs-units';
import { findDevice, getPendingAmount, findToken } from 'reducers/utils';
import * as SEND from 'actions/constants/send';
import * as ethUtils from 'utils/ethUtils';

import type {
    Dispatch,
    GetState,
    PayloadAction,
} from 'flowtype';
import type { State, FeeLevel } from 'reducers/SendFormEthereumReducer';

// general regular expressions
const NUMBER_RE: RegExp = new RegExp('^(0|0\\.([0-9]+)?|[1-9][0-9]*\\.?([0-9]+)?|\\.[0-9]+)$');
const UPPERCASE_RE = new RegExp('^(.*[A-Z].*)$');
const ABS_RE = new RegExp('^[0-9]+$');
const ETH_18_RE = new RegExp('^(0|0\\.([0-9]{0,18})?|[1-9][0-9]*\\.?([0-9]{0,18})?|\\.[0-9]{0,18})$');
const dynamicRegexp = (decimals: number): RegExp => {
    if (decimals > 0) {
        return new RegExp(`^(0|0\\.([0-9]{0,${decimals}})?|[1-9][0-9]*\\.?([0-9]{0,${decimals}})?|\\.[0-9]{1,${decimals}})$`);
    }
    return ABS_RE;
};

/*
* Called from SendFormActions.observe
* Reaction for WEB3.GAS_PRICE_UPDATED action
*/
export const onGasPriceUpdated = (network: string, gasPrice: string): PayloadAction<void> => (dispatch: Dispatch, getState: GetState): void => {
    // testing random data
    // function getRandomInt(min, max) {
    //     return Math.floor(Math.random() * (max - min + 1)) + min;
    // }
    // const newPrice = getRandomInt(10, 50).toString();

    const state = getState().sendFormEthereum;
    if (network === state.networkSymbol) return;

    // check if new price is different then currently recommended
    const newPrice: string = EthereumjsUnits.convert(gasPrice, 'wei', 'gwei');

    if (newPrice !== state.recommendedGasPrice) {
        if (!state.untouched) {
            // if there is a transaction draft let the user know
            // and let him update manually
            dispatch({
                type: SEND.CHANGE,
                networkType: 'ethereum',
                state: {
                    ...state,
                    gasPriceNeedsUpdate: true,
                    recommendedGasPrice: newPrice,
                },
            });
        } else {
            // automatically update feeLevels and gasPrice
            const feeLevels = getFeeLevels(state.networkSymbol, newPrice, state.gasLimit);
            const selectedFeeLevel = getSelectedFeeLevel(feeLevels, state.selectedFeeLevel);
            dispatch({
                type: SEND.CHANGE,
                networkType: 'ethereum',
                state: {
                    ...state,
                    gasPriceNeedsUpdate: false,
                    recommendedGasPrice: newPrice,
                    gasPrice: selectedFeeLevel.gasPrice,
                    feeLevels,
                    selectedFeeLevel,
                },
            });
        }
    }
};

/*
* Recalculate amount, total and fees
*/
export const validation = (): PayloadAction<State> => (dispatch: Dispatch, getState: GetState): State => {
    // clone deep nested object
    // to avoid overrides across state history
    let state: State = JSON.parse(JSON.stringify(getState().sendFormEthereum));
    // reset errors
    state.errors = {};
    state.warnings = {};
    state.infos = {};
    state = dispatch(recalculateTotalAmount(state));
    state = dispatch(updateCustomFeeLabel(state));
    state = dispatch(addressValidation(state));
    state = dispatch(addressLabel(state));
    state = dispatch(amountValidation(state));
    state = dispatch(gasLimitValidation(state));
    state = dispatch(gasPriceValidation(state));
    state = dispatch(nonceValidation(state));
    state = dispatch(dataValidation(state));
    return state;
};

export const recalculateTotalAmount = ($state: State): PayloadAction<State> => (dispatch: Dispatch, getState: GetState): State => {
    const {
        account,
        tokens,
        pending,
    } = getState().selectedAccount;
    if (!account) return $state;

    const state = { ...$state };
    const isToken = state.currency !== state.networkSymbol;

    if (state.setMax) {
        const pendingAmount = getPendingAmount(pending, state.currency, isToken);
        if (isToken) {
            const token = findToken(tokens, account.descriptor, state.currency, account.deviceState);
            if (token) {
                state.amount = new BigNumber(token.balance).minus(pendingAmount).toFixed();
            }
        } else {
            const b = new BigNumber(account.balance).minus(pendingAmount);
            state.amount = calculateMaxAmount(b, state.gasPrice, state.gasLimit);
        }
    }

    state.total = calculateTotal(isToken ? '0' : state.amount, state.gasPrice, state.gasLimit);
    return state;
};

export const updateCustomFeeLabel = ($state: State): PayloadAction<State> => (): State => {
    const state = { ...$state };
    if ($state.selectedFeeLevel.value === 'Custom') {
        state.selectedFeeLevel = {
            ...state.selectedFeeLevel,
            gasPrice: state.gasPrice,
            label: `${calculateFee(state.gasPrice, state.gasLimit)} ${state.networkSymbol}`,
        };
    }
    return state;
};

/*
* Address value validation
*/
export const addressValidation = ($state: State): PayloadAction<State> => (): State => {
    const state = { ...$state };
    if (!state.touched.address) return state;

    const { address } = state;

    if (address.length < 1) {
        state.errors.address = 'Address is not set';
    } else if (!EthereumjsUtil.isValidAddress(address)) {
        state.errors.address = 'Address is not valid';
    } else if (address.match(UPPERCASE_RE) && !EthereumjsUtil.isValidChecksumAddress(address)) {
        state.errors.address = 'Address is not a valid checksum';
    }
    return state;
};

/*
* Address label assignation
*/
export const addressLabel = ($state: State): PayloadAction<State> => (dispatch: Dispatch, getState: GetState): State => {
    const state = { ...$state };
    if (!state.touched.address || state.errors.address) return state;

    const {
        account,
        network,
    } = getState().selectedAccount;
    if (!account || !network) return state;
    const { address } = state;

    const savedAccounts = getState().accounts.filter(a => a.descriptor.toLowerCase() === address.toLowerCase());
    if (savedAccounts.length > 0) {
        // check if found account belongs to this network
        const currentNetworkAccount = savedAccounts.find(a => a.network === network.shortcut);
        if (currentNetworkAccount) {
            const device = findDevice(getState().devices, currentNetworkAccount.deviceID, currentNetworkAccount.deviceState);
            if (device) {
                state.infos.address = `${device.instanceLabel} Account #${(currentNetworkAccount.index + 1)}`;
            }
        } else {
            // corner-case: the same derivation path is used on different networks
            const otherNetworkAccount = savedAccounts[0];
            const device = findDevice(getState().devices, otherNetworkAccount.deviceID, otherNetworkAccount.deviceState);
            const { networks } = getState().localStorage.config;
            const otherNetwork = networks.find(c => c.shortcut === otherNetworkAccount.network);
            if (device && otherNetwork) {
                state.warnings.address = `Looks like it's ${device.instanceLabel} Account #${(otherNetworkAccount.index + 1)} address of ${otherNetwork.name} network`;
            }
        }
    }

    return state;
};

/*
* Amount value validation
*/
export const amountValidation = ($state: State): PayloadAction<State> => (dispatch: Dispatch, getState: GetState): State => {
    const state = { ...$state };
    if (!state.touched.amount) return state;

    const {
        account,
        tokens,
        pending,
    } = getState().selectedAccount;
    if (!account) return state;

    const { amount } = state;
    if (amount.length < 1) {
        state.errors.amount = 'Amount is not set';
    } else if (amount.length > 0 && !amount.match(NUMBER_RE)) {
        state.errors.amount = 'Amount is not a number';
    } else {
        const isToken: boolean = state.currency !== state.networkSymbol;
        const pendingAmount: BigNumber = getPendingAmount(pending, state.currency, isToken);

        if (isToken) {
            const token = findToken(tokens, account.descriptor, state.currency, account.deviceState);
            if (!token) return state;
            const decimalRegExp = dynamicRegexp(parseInt(token.decimals, 0));

            if (!state.amount.match(decimalRegExp)) {
                state.errors.amount = `Maximum ${token.decimals} decimals allowed`;
            } else if (new BigNumber(state.total).greaterThan(account.balance)) {
                state.errors.amount = `Not enough ${state.networkSymbol} to cover transaction fee`;
            } else if (new BigNumber(state.amount).greaterThan(new BigNumber(token.balance).minus(pendingAmount))) {
                state.errors.amount = 'Not enough funds';
            } else if (new BigNumber(state.amount).lessThanOrEqualTo('0')) {
                state.errors.amount = 'Amount is too low';
            }
        } else if (!state.amount.match(ETH_18_RE)) {
            state.errors.amount = 'Maximum 18 decimals allowed';
        } else if (new BigNumber(state.total).greaterThan(new BigNumber(account.balance).minus(pendingAmount))) {
            state.errors.amount = 'Not enough funds';
        }
    }
    return state;
};

/*
* Gas limit value validation
*/
export const gasLimitValidation = ($state: State): PayloadAction<State> => (dispatch: Dispatch, getState: GetState): State => {
    const state = { ...$state };
    if (!state.touched.gasLimit) return state;

    const {
        network,
    } = getState().selectedAccount;
    if (!network) return state;

    const { gasLimit } = state;
    if (gasLimit.length < 1) {
        state.errors.gasLimit = 'Gas limit is not set';
    } else if (gasLimit.length > 0 && !gasLimit.match(NUMBER_RE)) {
        state.errors.gasLimit = 'Gas limit is not a number';
    } else {
        const gl: BigNumber = new BigNumber(gasLimit);
        if (gl.lessThan(1)) {
            state.errors.gasLimit = 'Gas limit is too low';
        } else if (gl.lessThan(state.currency !== state.networkSymbol ? network.defaultGasLimitTokens : network.defaultGasLimit)) {
            state.warnings.gasLimit = 'Gas limit is below recommended';
        }
    }
    return state;
};

/*
* Gas price value validation
*/
export const gasPriceValidation = ($state: State): PayloadAction<State> => (): State => {
    const state = { ...$state };
    if (!state.touched.gasPrice) return state;

    const { gasPrice } = state;
    if (gasPrice.length < 1) {
        state.errors.gasPrice = 'Gas price is not set';
    } else if (gasPrice.length > 0 && !gasPrice.match(NUMBER_RE)) {
        state.errors.gasPrice = 'Gas price is not a number';
    } else {
        const gp: BigNumber = new BigNumber(gasPrice);
        if (gp.greaterThan(1000)) {
            state.warnings.gasPrice = 'Gas price is too high';
        } else if (gp.lessThanOrEqualTo('0')) {
            state.errors.gasPrice = 'Gas price is too low';
        }
    }
    return state;
};

/*
* Nonce value validation
*/
export const nonceValidation = ($state: State): PayloadAction<State> => (dispatch: Dispatch, getState: GetState): State => {
    const state = { ...$state };
    if (!state.touched.nonce) return state;

    const {
        account,
    } = getState().selectedAccount;
    if (!account || account.networkType !== 'ethereum') return state;

    const { nonce } = state;
    if (nonce.length < 1) {
        state.errors.nonce = 'Nonce is not set';
    } else if (!nonce.match(ABS_RE)) {
        state.errors.nonce = 'Nonce is not a valid number';
    } else {
        const n: BigNumber = new BigNumber(nonce);
        if (n.lessThan(account.nonce)) {
            state.warnings.nonce = 'Nonce is lower than recommended';
        } else if (n.greaterThan(account.nonce)) {
            state.warnings.nonce = 'Nonce is greater than recommended';
        }
    }
    return state;
};

/*
* Gas price value validation
*/
export const dataValidation = ($state: State): PayloadAction<State> => (): State => {
    const state = { ...$state };
    if (!state.touched.data || state.data.length === 0) return state;
    if (!ethUtils.isHex(state.data)) {
        state.errors.data = 'Data is not valid hexadecimal';
    }
    return state;
};

/*
* UTILITIES
*/

export const calculateFee = (gasPrice: string, gasLimit: string): string => {
    try {
        return EthereumjsUnits.convert(new BigNumber(gasPrice).times(gasLimit).toFixed(), 'gwei', 'ether');
    } catch (error) {
        return '0';
    }
};

export const calculateTotal = (amount: string, gasPrice: string, gasLimit: string): string => {
    try {
        return new BigNumber(amount).plus(calculateFee(gasPrice, gasLimit)).toFixed();
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
        return max.toFixed();
    } catch (error) {
        return '0';
    }
};

export const getFeeLevels = (symbol: string, gasPrice: BigNumber | string, gasLimit: string, selected?: FeeLevel): Array<FeeLevel> => {
    const price: BigNumber = typeof gasPrice === 'string' ? new BigNumber(gasPrice) : gasPrice;
    const quarter: BigNumber = price.dividedBy(4);
    const high: string = price.plus(quarter.times(2)).toFixed();
    const low: string = price.minus(quarter.times(2)).toFixed();

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
            label: `${calculateFee(price.toFixed(), gasLimit)} ${symbol}`,
        },
        {
            value: 'Low',
            gasPrice: low,
            label: `${calculateFee(low, gasLimit)} ${symbol}`,
        },
        customLevel,
    ];
};

export const getSelectedFeeLevel = (feeLevels: Array<FeeLevel>, selected: FeeLevel): FeeLevel => {
    const { value } = selected;
    let selectedFeeLevel: ?FeeLevel;
    selectedFeeLevel = feeLevels.find(f => f.value === value);
    if (!selectedFeeLevel) {
        // fallback to default
        selectedFeeLevel = feeLevels.find(f => f.value === 'Normal');
    }
    return selectedFeeLevel || selected;
};