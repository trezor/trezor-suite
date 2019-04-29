/* @flow */
import TrezorConnect from 'trezor-connect';
import BigNumber from 'bignumber.js';
import * as SEND from 'actions/constants/send';
import { findDevice, getPendingAmount } from 'reducers/utils';
import { toDecimalAmount } from 'utils/formatUtils';
import { toFiatCurrency } from 'utils/fiatConverter';
import * as validators from 'utils/validators';
import l10nMessages from 'views/Wallet/views/Account/Send/validation.messages';
import l10nCommonMessages from 'views/common.messages';

import type {
    Dispatch,
    GetState,
    PayloadAction,
    PromiseAction,
    BlockchainFeeLevel,
} from 'flowtype';
import type { State, FeeLevel } from 'reducers/SendFormRippleReducer';

import AddressValidator from 'wallet-address-validator';

// general regular expressions
const U_INT_32 = 0xffffffff;

/*
 * Called from SendFormActions.observe
 * Reaction for BLOCKCHAIN.FEE_UPDATED action
 */
export const onFeeUpdated = (
    network: string,
    feeLevels: Array<BlockchainFeeLevel>
): PayloadAction<void> => (dispatch: Dispatch, getState: GetState): void => {
    const state = getState().sendFormRipple;
    if (network === state.networkSymbol) return;

    if (!state.untouched) {
        // if there is a transaction draft let the user know
        // and let him update manually
        dispatch({
            type: SEND.CHANGE,
            networkType: 'ripple',
            state: {
                ...state,
                feeNeedsUpdate: true,
            },
        });
        return;
    }

    // automatically update feeLevels
    const newFeeLevels = dispatch(getFeeLevels(feeLevels));
    const selectedFeeLevel = getSelectedFeeLevel(newFeeLevels, state.selectedFeeLevel);
    dispatch({
        type: SEND.CHANGE,
        networkType: 'ripple',
        state: {
            ...state,
            feeNeedsUpdate: false,
            feeLevels: newFeeLevels,
            selectedFeeLevel,
        },
    });
};

/*
 * Recalculate amount, total and fees
 */
export const validation = (prevState: State): PayloadAction<State> => (
    dispatch: Dispatch,
    getState: GetState
): State => {
    // clone deep nested object
    // to avoid overrides across state history
    let state: State = JSON.parse(JSON.stringify(getState().sendFormRipple));
    // reset errors
    state.errors = {};
    state.warnings = {};
    state.infos = {};
    state = dispatch(updateCustomFeeLabel(state));
    state = dispatch(recalculateTotalAmount(state));
    state = dispatch(addressValidation(state));
    state = dispatch(addressLabel(state));
    state = dispatch(amountValidation(state));
    state = dispatch(feeValidation(state));
    state = dispatch(destinationTagValidation(state));
    if (state.touched.address && prevState.address !== state.address) {
        dispatch(addressBalanceValidation(state));
    }
    return state;
};

const recalculateTotalAmount = ($state: State): PayloadAction<State> => (
    dispatch: Dispatch,
    getState: GetState
): State => {
    const { account, network, pending } = getState().selectedAccount;
    if (!account || account.networkType !== 'ripple' || !network) return $state;

    const state = { ...$state };
    const fee = toDecimalAmount(state.selectedFeeLevel.fee, network.decimals);

    if (state.setMax) {
        const pendingAmount = getPendingAmount(pending, state.networkSymbol, false);
        const availableBalance = new BigNumber(account.balance)
            .minus(account.reserve)
            .minus(pendingAmount);
        state.amount = calculateMaxAmount(availableBalance, fee);

        // calculate amount in local currency
        const { localCurrency } = getState().sendFormRipple;
        const fiatRates = getState().fiat.find(f => f.network === state.networkName);
        const localAmount = toFiatCurrency(state.amount, localCurrency, fiatRates);
        state.localAmount = localAmount;
    }

    state.total = calculateTotal(state.amount, fee);
    return state;
};

const updateCustomFeeLabel = ($state: State): PayloadAction<State> => (
    dispatch: Dispatch,
    getState: GetState
): State => {
    const { network } = getState().selectedAccount;
    if (!network) return $state; // flowtype fallback

    const state = { ...$state };
    if ($state.selectedFeeLevel.value === 'Custom') {
        state.selectedFeeLevel = {
            ...state.selectedFeeLevel,
            fee: state.fee,
            label: `${toDecimalAmount(state.fee, network.decimals)} ${state.networkSymbol}`,
        };
    }
    return state;
};

/*
 * Address value validation
 */
const addressValidation = ($state: State): PayloadAction<State> => (
    dispatch: Dispatch,
    getState: GetState
): State => {
    const state = { ...$state };
    if (!state.touched.address) return state;

    const { account, network } = getState().selectedAccount;
    if (!account || !network) return state;

    const { address } = state;

    if (address.length < 1) {
        state.errors.address = l10nMessages.TR_ADDRESS_IS_NOT_SET;
    } else if (!AddressValidator.validate(address, 'XRP')) {
        state.errors.address = l10nMessages.TR_ADDRESS_IS_NOT_VALID;
    } else if (address.toLowerCase() === account.descriptor.toLowerCase()) {
        state.errors.address = l10nMessages.TR_CANNOT_SEND_TO_MYSELF;
    }
    return state;
};

/*
 * Address balance validation
 * Fetch data from trezor-connect and set minimum required amount in reducer
 */
const addressBalanceValidation = ($state: State): PromiseAction<void> => async (
    dispatch: Dispatch,
    getState: GetState
): Promise<void> => {
    const { network } = getState().selectedAccount;
    if (!network) return;

    let minAmount: string = '0';
    const response = await TrezorConnect.rippleGetAccountInfo({
        account: {
            descriptor: $state.address,
        },
        coin: network.shortcut,
    });
    if (response.success) {
        const empty = response.payload.sequence <= 0 && response.payload.balance === '0';
        if (empty) {
            minAmount = toDecimalAmount(response.payload.reserve, network.decimals);
        }
    }

    // TODO: consider checking local (known) accounts reserve instead of async fetching

    // a2 (not empty): rJX2KwzaLJDyFhhtXKi3htaLfaUH2tptEX
    // a4 (empty): r9skfe7kZkvqss7oMB3tuj4a59PXD5wRa2

    dispatch({
        type: SEND.CHANGE,
        networkType: 'ripple',
        state: {
            ...getState().sendFormRipple,
            minAmount,
        },
    });
};

/*
 * Address label assignation
 */
const addressLabel = ($state: State): PayloadAction<State> => (
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
const amountValidation = ($state: State): PayloadAction<State> => (
    dispatch: Dispatch,
    getState: GetState
): State => {
    const state = { ...$state };
    if (!state.touched.amount) return state;

    const { account, pending } = getState().selectedAccount;
    if (!account || account.networkType !== 'ripple') return state;

    const { amount } = state;
    if (amount.length < 1) {
        state.errors.amount = l10nMessages.TR_AMOUNT_IS_NOT_SET;
    } else if (amount.length > 0 && !validators.isNumber(amount)) {
        state.errors.amount = l10nMessages.TR_AMOUNT_IS_NOT_A_NUMBER;
    } else {
        const pendingAmount: BigNumber = getPendingAmount(pending, state.networkSymbol);
        if (!validators.hasDecimals(state.amount, 6)) {
            state.errors.amount = {
                ...l10nMessages.TR_MAXIMUM_DECIMALS_ALLOWED,
                values: { decimals: 6 },
            };
        } else if (
            new BigNumber(state.total).isGreaterThan(
                new BigNumber(account.balance).minus(pendingAmount)
            )
        ) {
            state.errors.amount = l10nMessages.TR_NOT_ENOUGH_FUNDS;
        }
    }

    if (
        !state.errors.amount &&
        new BigNumber(account.balance).minus(state.total).lt(account.reserve)
    ) {
        state.errors.amount = {
            ...l10nMessages.TR_NOT_ENOUGH_FUNDS_RESERVED_AMOUNT,
            values: {
                reservedAmount: account.reserve,
                networkSymbol: state.networkSymbol,
            },
        };
    }

    if (!state.errors.amount && new BigNumber(state.amount).lt(state.minAmount)) {
        state.errors.amount = {
            ...l10nMessages.TR_AMOUNT_IS_TOO_LOW_MINIMUM_AMOUNT_FOR_CREATING,
            values: {
                reservedAmount: state.minAmount,
                networkSymbol: state.networkSymbol,
            },
        };
    }

    return state;
};

/*
 * Fee value validation
 */
export const feeValidation = ($state: State): PayloadAction<State> => (
    dispatch: Dispatch,
    getState: GetState
): State => {
    const state = { ...$state };
    if (!state.touched.fee) return state;

    const { network } = getState().selectedAccount;
    if (!network) return state;

    const { fee } = state;
    if (fee.length < 1) {
        state.errors.fee = l10nMessages.TR_FEE_IS_NOT_SET;
    } else if (fee.length > 0 && !validators.isAbs(fee)) {
        state.errors.fee = l10nMessages.TR_FEE_MUST_ME_AN_ABSOLUT_NUMBER;
    } else {
        const gl: BigNumber = new BigNumber(fee);
        if (gl.isLessThan(network.fee.minFee)) {
            state.errors.fee = l10nMessages.TR_FEE_IS_BELOW_RECOMMENDED;
        } else if (gl.isGreaterThan(network.fee.maxFee)) {
            state.errors.fee = l10nMessages.TR_FEE_IS_ABOVE_RECOMMENDED;
        }
    }
    return state;
};
/*
 * Destination Tag value validation
 */
export const destinationTagValidation = ($state: State): PayloadAction<State> => (): State => {
    const state = { ...$state };
    if (!state.touched.destinationTag) return state;

    const { destinationTag } = state;

    if (destinationTag.length > 0 && !validators.isAbs(destinationTag)) {
        state.errors.destinationTag = l10nMessages.TR_DESTINATION_TAG_MUST_BE_AN_ABSOLUTE;
    }

    if (parseInt(destinationTag, 10) > U_INT_32) {
        state.errors.destinationTag = l10nMessages.TR_DESTINATION_TAG_IS_NOT_VALID;
    }

    return state;
};

/*
 * UTILITIES
 */

const calculateTotal = (amount: string, fee: string): string => {
    try {
        const bAmount = new BigNumber(amount);
        // BigNumber() returns NaN on non-numeric string
        if (bAmount.isNaN()) {
            throw new Error('Amount is not a number');
        }
        return bAmount.plus(fee).toFixed();
    } catch (error) {
        return '0';
    }
};

const calculateMaxAmount = (balance: BigNumber, fee: string): string => {
    try {
        // TODO - minus pendings
        const max = balance.minus(fee);
        if (max.isLessThan(0)) return '0';
        return max.toFixed();
    } catch (error) {
        return '0';
    }
};

// Generate FeeLevel dataset for "fee" select
export const getFeeLevels = (
    feeLevels: Array<BlockchainFeeLevel>,
    selected?: FeeLevel
): PayloadAction<Array<FeeLevel>> => (dispatch: Dispatch, getState: GetState): Array<FeeLevel> => {
    const { network } = getState().selectedAccount;
    if (!network) return []; // flowtype fallback

    const l10nFeeMap = {
        Low: l10nCommonMessages.TR_LOW_FEE,
        Normal: l10nCommonMessages.TR_NORMAL_FEE,
        High: l10nCommonMessages.TR_HIGH_FEE,
    };

    // map BlockchainFeeLevel to SendFormReducer FeeLevel
    const levels = feeLevels.map(level => ({
        value: level.name,
        localizedValue: l10nFeeMap[level.value] || level.value,
        fee: level.value,
        label: `${toDecimalAmount(level.value, network.decimals)} ${network.symbol}`,
    }));

    // add "Custom" level
    const customLevel =
        selected && selected.value === 'Custom'
            ? {
                  value: 'Custom',
                  localizedValue: l10nCommonMessages.TR_CUSTOM_FEE,
                  fee: selected.fee,
                  label: `${toDecimalAmount(selected.fee, network.decimals)} ${network.symbol}`,
              }
            : {
                  value: 'Custom',
                  localizedValue: l10nCommonMessages.TR_CUSTOM_FEE,
                  fee: '0',
                  label: '',
              };

    return levels.concat([customLevel]);
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
