/* @flow */

import BigNumber from 'bignumber.js';
import EthereumjsUtil from 'ethereumjs-util';
import EthereumjsUnits from 'ethereumjs-units';
import { findDevice, getPendingAmount, findToken } from 'reducers/utils';
import { toFiatCurrency } from 'utils/fiatConverter';
import * as SEND from 'actions/constants/send';
import * as ethUtils from 'utils/ethUtils';
import * as validators from 'utils/validators';

import type { Dispatch, GetState, PayloadAction } from 'flowtype';
import type { State, FeeLevel } from 'reducers/SendFormEthereumReducer';
import l10nMessages from 'views/Wallet/views/Account/Send/validation.messages';
import l10nCommonMessages from 'views/common.messages';

/*
 * Called from SendFormActions.observe
 * Reaction for WEB3.GAS_PRICE_UPDATED action
 */
export const onGasPriceUpdated = (network: string, gasPrice: string): PayloadAction<void> => (
    dispatch: Dispatch,
    getState: GetState
): void => {
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
export const validation = (): PayloadAction<State> => (
    dispatch: Dispatch,
    getState: GetState
): State => {
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

export const recalculateTotalAmount = ($state: State): PayloadAction<State> => (
    dispatch: Dispatch,
    getState: GetState
): State => {
    const { account, tokens, pending } = getState().selectedAccount;
    if (!account) return $state;

    const state = { ...$state };
    const isToken = state.currency !== state.networkSymbol;

    if (state.setMax) {
        const pendingAmount = getPendingAmount(pending, state.currency, isToken);
        if (isToken) {
            const token = findToken(
                tokens,
                account.descriptor,
                state.currency,
                account.deviceState
            );
            if (token) {
                state.amount = new BigNumber(token.balance).minus(pendingAmount).toFixed();
            }
        } else {
            const b = new BigNumber(account.balance).minus(pendingAmount);
            state.amount = calculateMaxAmount(b, state.gasPrice, state.gasLimit);
        }
        // calculate amount in local currency
        const { localCurrency } = getState().sendFormEthereum;
        const fiatRates = getState().fiat.find(f => f.network === state.currency.toLowerCase());
        const localAmount = toFiatCurrency(state.amount, localCurrency, fiatRates);
        state.localAmount = localAmount;
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
        // state.errors.address = 'Address is not set';
        state.errors.address = l10nMessages.TR_ADDRESS_IS_NOT_SET;
    } else if (!EthereumjsUtil.isValidAddress(address)) {
        // state.errors.address = 'Address is not valid';
        state.errors.address = l10nMessages.TR_ADDRESS_IS_NOT_VALID;
    } else if (
        validators.hasUppercase(address) &&
        !EthereumjsUtil.isValidChecksumAddress(address)
    ) {
        // state.errors.address = 'Address is not a valid checksum';
        state.errors.address = l10nMessages.TR_ADDRESS_CHECKSUM_IS_NOT_VALID;
    }
    return state;
};

/*
 * Address label assignation
 */
export const addressLabel = ($state: State): PayloadAction<State> => (
    dispatch: Dispatch,
    getState: GetState
): State => {
    const state = { ...$state };
    if (!state.touched.address || state.errors.address) return state;

    const { account, network } = getState().selectedAccount;
    if (!account || !network) return state;
    const { address } = state;

    const savedAccounts = getState().accounts.filter(
        a => a.descriptor.toLowerCase() === address.toLowerCase()
    );
    if (savedAccounts.length > 0) {
        // check if found account belongs to this network
        const currentNetworkAccount = savedAccounts.find(a => a.network === network.shortcut);
        if (currentNetworkAccount) {
            const device = findDevice(
                getState().devices,
                currentNetworkAccount.deviceID,
                currentNetworkAccount.deviceState
            );
            if (device) {
                state.infos.address = {
                    ...l10nCommonMessages.TR_DEVICE_LABEL_ACCOUNT_HASH,
                    values: {
                        deviceLabel: device.instanceLabel,
                        number: currentNetworkAccount.index + 1,
                    },
                };
            }
        } else {
            // corner-case: the same derivation path is used on different networks
            const otherNetworkAccount = savedAccounts[0];
            const device = findDevice(
                getState().devices,
                otherNetworkAccount.deviceID,
                otherNetworkAccount.deviceState
            );
            const { networks } = getState().localStorage.config;
            const otherNetwork = networks.find(c => c.shortcut === otherNetworkAccount.network);
            if (device && otherNetwork) {
                state.warnings.address = {
                    ...l10nCommonMessages.TR_LOOKS_LIKE_IT_IS_DEVICE_LABEL,
                    values: {
                        deviceLabel: device.instanceLabel,
                        number: otherNetworkAccount.index + 1,
                        network: otherNetwork.name,
                    },
                };
            }
        }
    }

    return state;
};

/*
 * Amount value validation
 */
export const amountValidation = ($state: State): PayloadAction<State> => (
    dispatch: Dispatch,
    getState: GetState
): State => {
    const state = { ...$state };
    if (!state.touched.amount) return state;

    const { account, tokens, pending } = getState().selectedAccount;
    if (!account) return state;

    const { amount } = state;
    if (amount.length < 1) {
        // state.errors.amount = 'Amount is not set';
        state.errors.amount = l10nMessages.TR_AMOUNT_IS_NOT_SET;
    } else if (amount.length > 0 && !validators.isNumber(amount)) {
        // state.errors.amount = 'Amount is not a number';
        state.errors.amount = l10nMessages.TR_AMOUNT_IS_NOT_A_NUMBER;
    } else {
        const isToken: boolean = state.currency !== state.networkSymbol;
        const pendingAmount: BigNumber = getPendingAmount(pending, state.currency, isToken);

        if (isToken) {
            const token = findToken(
                tokens,
                account.descriptor,
                state.currency,
                account.deviceState
            );
            if (!token) return state;

            if (!validators.hasDecimals(state.amount, parseInt(token.decimals, 0))) {
                // state.errors.amount = `Maximum ${token.decimals} decimals allowed`;
                state.errors.amount = {
                    ...l10nMessages.TR_MAXIMUM_DECIMALS_ALLOWED,
                    values: { decimals: token.decimals },
                };
            } else if (new BigNumber(state.total).isGreaterThan(account.balance)) {
                state.errors.amount = {
                    ...l10nMessages.TR_NOT_ENOUGH_FUNDS_TO_COVER_TRANSACTION,
                    values: {
                        networkSymbol: state.networkSymbol,
                    },
                };
                // state.errors.amount = `Not enough ${state.networkSymbol} to cover transaction fee`;
            } else if (
                new BigNumber(state.amount).isGreaterThan(
                    new BigNumber(token.balance).minus(pendingAmount)
                )
            ) {
                // state.errors.amount = 'Not enough funds';
                state.errors.amount = l10nMessages.TR_NOT_ENOUGH_FUNDS;
            } else if (new BigNumber(state.amount).isLessThanOrEqualTo('0')) {
                // TODO: this is never gonna happen! It will fail in second if condiftion (isNumber validation)
                // state.errors.amount = 'Amount is too low';
                state.errors.amount = l10nMessages.TR_AMOUNT_IS_TOO_LOW;
            }
        } else if (!validators.hasDecimals(state.amount, 18)) {
            // state.errors.amount = 'Maximum 18 decimals allowed';
            state.errors.amount = {
                ...l10nMessages.TR_MAXIMUM_DECIMALS_ALLOWED,
                values: {
                    decimals: 18,
                },
            };
        } else if (
            new BigNumber(state.total).isGreaterThan(
                new BigNumber(account.balance).minus(pendingAmount)
            )
        ) {
            // state.errors.amount = 'Not enough funds';
            state.errors.amount = l10nMessages.TR_NOT_ENOUGH_FUNDS;
        }
    }
    return state;
};

/*
 * Gas limit value validation
 */
export const gasLimitValidation = ($state: State): PayloadAction<State> => (
    dispatch: Dispatch,
    getState: GetState
): State => {
    const state = { ...$state };
    if (!state.touched.gasLimit) return state;

    const { network } = getState().selectedAccount;
    if (!network) return state;

    const { gasLimit } = state;
    if (gasLimit.length < 1) {
        // state.errors.gasLimit = 'Gas limit is not set';
        state.errors.gasLimit = l10nMessages.TR_GAS_LIMIT_IS_NOT_SET;
    } else if (gasLimit.length > 0 && !validators.isNumber(gasLimit)) {
        // state.errors.gasLimit = 'Gas limit is not a number';
        state.errors.gasLimit = l10nMessages.TR_GAS_LIMIT_IS_NOT_A_NUMBER;
    } else {
        const gl: BigNumber = new BigNumber(gasLimit);
        if (gl.isLessThan(1)) {
            // state.errors.gasLimit = 'Gas limit is too low';
            state.errors.gasLimit = l10nMessages.TR_GAS_LIMIT_IS_TOO_LOW;
        } else if (
            gl.isLessThan(
                state.currency !== state.networkSymbol
                    ? network.defaultGasLimitTokens
                    : network.defaultGasLimit
            )
        ) {
            // state.warnings.gasLimit = 'Gas limit is below recommended';
            state.warnings.gasLimit = l10nMessages.TR_GAS_LIMIT_IS_BELOW_RECOMMENDED;
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
        // state.errors.gasPrice = 'Gas price is not set';
        state.errors.gasPrice = l10nMessages.TR_GAS_PRICE_IS_NOT_SET;
    } else if (gasPrice.length > 0 && !validators.isNumber(gasPrice)) {
        // state.errors.gasPrice = 'Gas price is not a number';
        state.errors.gasPrice = l10nMessages.TR_GAS_PRICE_IS_NOT_A_NUMBER;
    } else {
        const gp: BigNumber = new BigNumber(gasPrice);
        if (gp.isGreaterThan(1000)) {
            // state.warnings.gasPrice = 'Gas price is too high';
            state.warnings.gasPrice = l10nMessages.TR_GAS_PRICE_IS_TOO_HIGH;
        } else if (gp.isLessThanOrEqualTo('0')) {
            // state.errors.gasPrice = 'Gas price is too low';
            state.errors.gasPrice = l10nMessages.TR_GAS_PRICE_IS_TOO_LOW;
        }
    }
    return state;
};

/*
 * Nonce value validation
 */
export const nonceValidation = ($state: State): PayloadAction<State> => (
    dispatch: Dispatch,
    getState: GetState
): State => {
    const state = { ...$state };
    if (!state.touched.nonce) return state;

    const { account } = getState().selectedAccount;
    if (!account || account.networkType !== 'ethereum') return state;

    const { nonce } = state;
    if (nonce.length < 1) {
        // state.errors.nonce = 'Nonce is not set';
        state.errors.nonce = l10nMessages.TR_NONCE_IS_NOT_SET;
    } else if (!validators.isAbs(nonce)) {
        // state.errors.nonce = 'Nonce is not a valid number';
        state.errors.nonce = l10nMessages.TR_NONCE_IS_NOT_A_NUMBER;
    } else {
        const n: BigNumber = new BigNumber(nonce);
        if (n.isLessThan(account.nonce)) {
            // state.warnings.nonce = 'Nonce is lower than recommended';
            state.warnings.nonce = l10nMessages.TR_NONCE_IS_LOWER_THAN_RECOMMENDED;
        } else if (n.isGreaterThan(account.nonce)) {
            // state.warnings.nonce = 'Nonce is greater than recommended';
            state.warnings.nonce = l10nMessages.TR_NONCE_IS_GREATER_THAN_RECOMMENDED;
        }
    }
    return state;
};

/*
 * Data validation
 */
export const dataValidation = ($state: State): PayloadAction<State> => (): State => {
    const state = { ...$state };
    if (!state.touched.data || state.data.length === 0) return state;

    if (!ethUtils.isHex(state.data)) {
        // state.errors.data = 'Data is not valid hexadecimal';
        state.errors.data = l10nMessages.TR_DATA_IS_NOT_VALID_HEX;
    }
    return state;
};

/*
 * UTILITIES
 */

export const calculateFee = (gasPrice: string, gasLimit: string): string => {
    try {
        return EthereumjsUnits.convert(
            new BigNumber(gasPrice).times(gasLimit).toFixed(),
            'gwei',
            'ether'
        );
    } catch (error) {
        return '0';
    }
};

export const calculateTotal = (amount: string, gasPrice: string, gasLimit: string): string => {
    try {
        const bAmount = new BigNumber(amount);
        // BigNumber() returns NaN on non-numeric string
        if (bAmount.isNaN()) {
            throw new Error('Amount is not a number');
        }
        return bAmount.plus(calculateFee(gasPrice, gasLimit)).toFixed();
    } catch (error) {
        return '0';
    }
};

export const calculateMaxAmount = (
    balance: BigNumber,
    gasPrice: string,
    gasLimit: string
): string => {
    try {
        // TODO - minus pendings
        const fee = calculateFee(gasPrice, gasLimit);
        const max = balance.minus(fee);
        if (max.isLessThan(0)) return '0';
        return max.toFixed();
    } catch (error) {
        return '0';
    }
};

export const getFeeLevels = (
    symbol: string,
    gasPrice: BigNumber | string,
    gasLimit: string,
    selected?: FeeLevel
): Array<FeeLevel> => {
    const price: BigNumber = typeof gasPrice === 'string' ? new BigNumber(gasPrice) : gasPrice;
    const quarter: BigNumber = price.dividedBy(4);
    const high: string = price.plus(quarter.times(2)).toFixed();
    const low: string = price.minus(quarter.times(2)).toFixed();

    const customLevel: FeeLevel =
        selected && selected.value === 'Custom'
            ? {
                  value: 'Custom',
                  localizedValue: l10nCommonMessages.TR_CUSTOM_FEE,
                  gasPrice: selected.gasPrice,
                  // label: `${ calculateFee(gasPrice, gasLimit) } ${ symbol }`
                  label: `${calculateFee(selected.gasPrice, gasLimit)} ${symbol}`,
              }
            : {
                  value: 'Custom',
                  localizedValue: l10nCommonMessages.TR_CUSTOM_FEE,
                  gasPrice: low,
                  label: '',
              };

    return [
        {
            value: 'High',
            localizedValue: l10nCommonMessages.TR_HIGH_FEE,
            gasPrice: high,
            label: `${calculateFee(high, gasLimit)} ${symbol}`,
        },
        {
            value: 'Normal',
            localizedValue: l10nCommonMessages.TR_NORMAL_FEE,
            gasPrice: gasPrice.toString(),
            label: `${calculateFee(price.toFixed(), gasLimit)} ${symbol}`,
        },
        {
            value: 'Low',
            localizedValue: l10nCommonMessages.TR_LOW_FEE,
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
