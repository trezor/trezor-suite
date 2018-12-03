/* @flow */

import BigNumber from 'bignumber.js';
import { findDevice, getPendingAmount } from 'reducers/utils';
import { toDecimalAmount } from 'utils/formatUtils';

import type {
    Dispatch,
    GetState,
    PayloadAction,
} from 'flowtype';
import type { State, FeeLevel } from 'reducers/SendFormRippleReducer';

// general regular expressions
const XRP_ADDRESS_RE = new RegExp('^r[1-9A-HJ-NP-Za-km-z]{25,34}$');
const NUMBER_RE: RegExp = new RegExp('^(0|0\\.([0-9]+)?|[1-9][0-9]*\\.?([0-9]+)?|\\.[0-9]+)$');
const XRP_6_RE = new RegExp('^(0|0\\.([0-9]{0,6})?|[1-9][0-9]*\\.?([0-9]{0,6})?|\\.[0-9]{0,6})$');

/*
* Recalculate amount, total and fees
*/
export const validation = (): PayloadAction<State> => (dispatch: Dispatch, getState: GetState): State => {
    // clone deep nested object
    // to avoid overrides across state history
    let state: State = JSON.parse(JSON.stringify(getState().sendFormRipple));
    // reset errors
    state.errors = {};
    state.warnings = {};
    state.infos = {};
    state = dispatch(recalculateTotalAmount(state));
    state = dispatch(addressValidation(state));
    state = dispatch(addressLabel(state));
    state = dispatch(amountValidation(state));
    return state;
};

const recalculateTotalAmount = ($state: State): PayloadAction<State> => (dispatch: Dispatch, getState: GetState): State => {
    const {
        account,
        pending,
    } = getState().selectedAccount;
    if (!account) return $state;

    const blockchain = getState().blockchain.find(b => b.shortcut === account.network);
    if (!blockchain) return $state;
    const fee = toDecimalAmount(blockchain.fee, 6);

    const state = { ...$state };

    if (state.setMax) {
        const pendingAmount = getPendingAmount(pending, state.networkSymbol, false);
        const b = new BigNumber(account.balance).minus(pendingAmount);
        state.amount = calculateMaxAmount(b, fee);
    }

    state.total = calculateTotal(state.amount, fee);
    return state;
};

/*
* Address value validation
*/
const addressValidation = ($state: State): PayloadAction<State> => (dispatch: Dispatch, getState: GetState): State => {
    const state = { ...$state };
    if (!state.touched.address) return state;

    const { account, network } = getState().selectedAccount;
    if (!account || !network) return state;

    const { address } = state;

    if (address.length < 1) {
        state.errors.address = 'Address is not set';
    } else if (!address.match(XRP_ADDRESS_RE)) {
        state.errors.address = 'Address is not valid';
    } else if (address.toLowerCase() === account.address.toLowerCase()) {
        state.errors.address = 'Cannot send to myself';
    }
    return state;
};

/*
* Address label assignation
*/
const addressLabel = ($state: State): PayloadAction<State> => (dispatch: Dispatch, getState: GetState): State => {
    const state = { ...$state };
    if (!state.touched.address || state.errors.address) return state;

    const {
        account,
        network,
    } = getState().selectedAccount;
    if (!account || !network) return state;
    const { address } = state;

    const savedAccounts = getState().accounts.filter(a => a.address.toLowerCase() === address.toLowerCase());
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
const amountValidation = ($state: State): PayloadAction<State> => (dispatch: Dispatch, getState: GetState): State => {
    const state = { ...$state };
    if (!state.touched.amount) return state;

    const {
        account,
        pending,
    } = getState().selectedAccount;
    if (!account) return state;

    const { amount } = state;
    if (amount.length < 1) {
        state.errors.amount = 'Amount is not set';
    } else if (amount.length > 0 && !amount.match(NUMBER_RE)) {
        state.errors.amount = 'Amount is not a number';
    } else {
        const pendingAmount: BigNumber = getPendingAmount(pending, state.networkSymbol);

        if (!state.amount.match(XRP_6_RE)) {
            state.errors.amount = 'Maximum 6 decimals allowed';
        } else if (new BigNumber(state.total).greaterThan(new BigNumber(account.balance).minus(pendingAmount))) {
            state.errors.amount = 'Not enough funds';
        }
    }
    return state;
};

/*
* UTILITIES
*/

const calculateTotal = (amount: string, fee: string): string => {
    try {
        return new BigNumber(amount).plus(fee).toString(10);
    } catch (error) {
        return '0';
    }
};

const calculateMaxAmount = (balance: BigNumber, fee: string): string => {
    try {
        // TODO - minus pendings
        const max = balance.minus(fee);
        if (max.lessThan(0)) return '0';
        return max.toString(10);
    } catch (error) {
        return '0';
    }
};

export const getFeeLevels = (shortcut: string): Array<FeeLevel> => ([
    {
        value: 'Normal',
        gasPrice: '1',
        label: `1 ${shortcut}`,
    },
]);


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
