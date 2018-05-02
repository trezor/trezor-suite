/* @flow */
'use strict';

import * as SEND from './constants/send';
import * as NOTIFICATION from './constants/notification';

import { estimateGas, getGasPrice, pushTx } from './Web3Actions';

import EthereumjsUtil from 'ethereumjs-util';
import EthereumjsUnits from 'ethereumjs-units';
import EthereumjsTx from 'ethereumjs-tx';
import TrezorConnect from 'trezor-connect';
import { strip } from '../utils/ethUtils';
import { push } from 'react-router-redux';
import BigNumber from 'bignumber.js';

import { initialState } from '../reducers/SendFormReducer';
import { findAccount } from '../reducers/AccountsReducer';
import { findToken } from '../reducers/TokensReducer';
import { findSelectedDevice } from '../reducers/TrezorConnectReducer';

import type { 
    Dispatch,
    GetState,
    Action,
    ThunkAction,
    AsyncAction,
    RouterLocationState,
    TrezorDevice
} from '../flowtype';
import type { State as AccountState } from '../reducers/AbstractAccountReducer';
import type { Web3Instance } from '../reducers/Web3Reducer';
import type { Config, Coin } from '../reducers/LocalStorageReducer';
import type { Token } from '../reducers/TokensReducer';
import type { State, FeeLevel } from '../reducers/SendFormReducer';
import type { Account } from '../reducers/AccountsReducer';

export type SendFormAction = {
    type: typeof SEND.TX_COMPLETE,
} | {
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
    type: typeof SEND.DATA_CHANGE,
    state: State
} | {
    type: typeof SEND.SEND,
} | {
    type: typeof SEND.TX_ERROR,
};

//const numberRegExp = new RegExp('^([0-9]{0,10}\\.)?[0-9]{1,18}$');
const numberRegExp: RegExp = new RegExp('^(0|0\\.([0-9]+)?|[1-9]+\\.?([0-9]+)?|\\.[0-9]+)$');

const calculateFee = (gasPrice: string, gasLimit: string): string => {
    return EthereumjsUnits.convert( new BigNumber(gasPrice).times(gasLimit), 'gwei', 'ether');
}

const calculateTotal = (amount: string, gasPrice: string, gasLimit: string): string => {
    try {
        return new BigNumber(amount).plus( calculateFee(gasPrice, gasLimit) ).toString();
    } catch (error) {
        return '0';
    }
}

const calculateMaxAmount = (balance: string, gasPrice: string, gasLimit: string): string => {
    try {
        const fee = EthereumjsUnits.convert( new BigNumber(gasPrice).times(gasLimit), 'gwei', 'ether');
        const b = new BigNumber(balance);
        const max = b.minus(fee);
        if (max.lessThan(0)) return '0';
        return max.toString();
    } catch (error) {
        return '0';
    }
    
}

const getMaxAmount = () => {

}

export const getFeeLevels = (symbol: string, gasPrice: BigNumber | string, gasLimit: string): Array<FeeLevel> => {
    if (typeof gasPrice === 'string') gasPrice = new BigNumber(gasPrice);
    const quarter: BigNumber = gasPrice.dividedBy(4);
    const high: string = gasPrice.plus(quarter.times(2)).toString();
    const low: string = gasPrice.minus(quarter.times(2)).toString();

    return [
        { 
            value: 'High',
            gasPrice: high,
            label: `${ calculateFee(high, gasLimit) } ${ symbol }`
        },
        { 
            value: 'Normal',
            gasPrice: gasPrice.toString(),
            label: `${ calculateFee(gasPrice.toString(), gasLimit) } ${ symbol }`
        },
        { 
            value: 'Low',
            gasPrice: low,
            label: `${ calculateFee(low, gasLimit) } ${ symbol }`
        },
        { 
            value: 'Custom',
            gasPrice: low, 
            label: '',
        },
    ]
}

// export const findBalance = (getState: GetState): string => {
//     const accountState = getState().abstractAccount;
//     const { token } = getState().sendForm;
//     const account: ?Account = findAccount(getState().accounts, accountState.index, accountState.deviceState, accountState.network);

//     if (token !== state.network) {
//         return getState().tokens.find(t => t.ethAddress === account.address && t.symbol === token).balance;
//     } else {
//         return account.balance;
//     }
// }


// initialize component
export const init = (): ThunkAction => {
    return (dispatch: Dispatch, getState: GetState): void => {

        const accountState: AccountState = getState().abstractAccount;

        const { location } = getState().router;
        const urlParams: RouterLocationState = location.state;

        const selected: ?TrezorDevice = findSelectedDevice( getState().connect );
        if (!selected) return;

        const web3instance: ?Web3Instance = getState().web3.find(w3 => w3.network === urlParams.network);
        if (!web3instance) {
            // no backend for this network
            return;
        }

        // TODO: check if there are some unfinished tx in localStorage
        const { config } = getState().localStorage;
        if (!config) return;

        const coin: ?Coin = config.coins.find(c => c.network === urlParams.network);
        if (!coin) return;

        const gasPrice: BigNumber = new BigNumber( EthereumjsUnits.convert(web3instance.gasPrice, 'wei', 'gwei') ) || new BigNumber(coin.defaultGasPrice);
        const gasLimit: string = coin.defaultGasLimit.toString();
        const feeLevels: Array<FeeLevel> = getFeeLevels(coin.symbol, gasPrice, gasLimit);

        // TODO: get nonce

        const state: State = {
            ...initialState,
            network: coin.network,
            coinSymbol: coin.symbol,
            token: coin.network,
            feeLevels,
            selectedFeeLevel: feeLevels.find(f => f.value === 'Normal'),
            recommendedGasPrice: gasPrice.toString(),
            gasLimit,
            gasPrice: gasPrice.toString(),
            nonce: '', // TODO!!!
        };

        dispatch({
            type: SEND.INIT,
            state
        });
    }
}

export const update = (): ThunkAction => {
    return (dispatch: Dispatch, getState: GetState): void => {
        const {
            abstractAccount,
            router
        } = getState();

        const isLocationChanged: boolean = router.location.pathname !== abstractAccount.location;
        if (isLocationChanged) {
            dispatch( init() );
            return;
        }
    }
}

export const dispose = (): Action => {
    return {
        type: SEND.DISPOSE
    }
}

export const toggleAdvanced = (address: string): Action => {
    return {
        type: SEND.TOGGLE_ADVANCED
    }
}

export const validation = (): ThunkAction => {
    return (dispatch: Dispatch, getState: GetState): void => {
        
        const accountState: AccountState = getState().abstractAccount;
        const state: State = getState().sendForm;

        const errors: {[k: string]: string} = {};
        const warnings: {[k: string]: string} = {};
        const infos: {[k: string]: string} = {};

        if (!state.untouched) {
            // valid address
            if (state.touched.address) {

                const accounts = getState().accounts;
                const myAccount = accounts.find(a => a.address.toLowerCase() === state.address.toLowerCase());

                if (state.address.length < 1) {
                    errors.address = 'Address is not set';
                } else if (!EthereumjsUtil.isValidAddress(state.address)) {
                    errors.address = 'Address is not valid';
                } else if (myAccount) {
                    if (myAccount.network === accountState.network) {
                        infos.address = `TREZOR Address #${ (myAccount.index + 1) }`;
                    } else {
                        // TODO: load coins from config
                        warnings.address = `Looks like it's TREZOR address in Account #${ (myAccount.index + 1) } of ${ myAccount.network.toUpperCase() } network`;
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

                    const account: ?Account = findAccount(getState().accounts, accountState.index, accountState.deviceState, accountState.network);
                    if (!account) return; // this should not happen

                    let decimalRegExp: RegExp;

                    if (state.token !== accountState.network) {
                        const token: any = getState().tokens.find(t => t.ethAddress === account.address && t.symbol === state.token);
                        
                        if (parseInt(token.decimals) > 0) {
                            decimalRegExp = new RegExp('^(0|0\\.([0-9]{0,' + token.decimals + '})?|[1-9]+\\.?([0-9]{0,' + token.decimals + '})?|\\.[0-9]{1,' + token.decimals + '})$');
                        } else {
                            // decimalRegExp = new RegExp('^(0|0\\.?|[1-9]+\\.?)$');
                            decimalRegExp = new RegExp('^[0-9]+$');
                        }

                        if (!state.amount.match(decimalRegExp)) {
                            errors.amount = `Maximum ${ token.decimals} decimals allowed`;
                        } else if (new BigNumber(state.total).greaterThan(account.balance)) {
                            errors.amount = `Not enough ${ state.coinSymbol.toUpperCase() } to cover transaction fee`;
                        } else if (new BigNumber(state.amount).greaterThan(token.balance)) {
                            errors.amount = 'Not enough funds';
                        } else if (new BigNumber(state.amount).lessThanOrEqualTo('0')) {
                            errors.amount = 'Amount is too low';
                        }
                    } else {
                        decimalRegExp = new RegExp('^(0|0\\.([0-9]{0,18})?|[1-9]+\\.?([0-9]{0,18})?|\\.[0-9]{0,18})$');
                        if (!state.amount.match(decimalRegExp)) {
                            errors.amount = `Maximum 18 decimals allowed`;
                        } else if (new BigNumber(state.total).greaterThan(account.balance)) {
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
                    } else if (gl.lessThan(1000)) {
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
                    if (gp.greaterThan(100)) {
                        errors.gasPrice = 'Gas price is too high';
                    } else if (gp.lessThanOrEqualTo('0')) {
                        errors.gasPrice = 'Gas price is too low';
                    }
                }
            }

            // valid data
            if (state.touched.data && accountState.network === state.token && state.data.length > 0) {
                const re = /^[0-9A-Fa-f]+$/g;
                //const re = /^[0-9A-Fa-f]{6}$/g;
                if (!re.test(state.data)) {
                    errors.data = 'Data is not valid hexadecimal';
                }
            }

            // valid nonce?

            dispatch({
                type: SEND.VALIDATION,
                errors,
                warnings,
                infos
            });

        }
    }
}


export const onAddressChange = (address: string): ThunkAction => {
    return (dispatch: Dispatch, getState: GetState): void => {

        const currentState: State = getState().sendForm;
        const touched = { ...currentState.touched };
        touched.address = true;

        const state: State = {
            ...currentState,
            untouched: false,
            touched,
            address
        };

        dispatch({
            type: SEND.ADDRESS_CHANGE,
            state
        });
        dispatch( validation() );
    }
}

export const onAmountChange = (amount: string): ThunkAction => {
    return (dispatch: Dispatch, getState: GetState): void => {

        const accountState: AccountState = getState().abstractAccount;
        const currentState: State = getState().sendForm;
        const isToken: boolean = currentState.token !== accountState.network;        
        const touched = { ...currentState.touched };
        touched.amount = true;
        const total: string = calculateTotal(isToken ? '0' : amount, currentState.gasPrice, currentState.gasLimit);

        const state: State = {
            ...currentState,
            untouched: false,
            touched,
            setMax: false,
            amount,
            total
        };

        dispatch({
            type: SEND.AMOUNT_CHANGE,
            state
        });
        dispatch( validation() );
    }
}

export const onCurrencyChange = (currency: any): ThunkAction => {
    return (dispatch: Dispatch, getState: GetState): void => {
        const accountState: AccountState = getState().abstractAccount;
        const currentState: State = getState().sendForm;
        const isToken: boolean = currency.value !== accountState.network;

        const account: ?Account = findAccount(getState().accounts, accountState.index, accountState.deviceState, accountState.network);
        if (!account) {
            // account not found
            return;
        }

        const { config } = getState().localStorage;
        if (!config) return;
        const coin: ?Coin = config.coins.find(c => c.network === accountState.network);
        if (!coin) return;

        let gasLimit: string = '';
        let amount: string = currentState.amount;
        let total: string;

        if (isToken) {
            gasLimit = coin.defaultGasLimitTokens.toString();
            if (currentState.setMax) {
                const token: ?Token = findToken(getState().tokens, account.address, currentState.token, accountState.deviceState);
                if (!token) return;
                amount = token.balance;
            }
            total = calculateTotal('0', currentState.gasPrice, currentState.gasLimit);
        } else {
            gasLimit = coin.defaultGasLimit.toString(); 
            if (currentState.setMax) {
                amount = calculateMaxAmount(account.balance, currentState.gasPrice, currentState.gasLimit);
            }
            total = calculateTotal(amount, currentState.gasPrice, currentState.gasLimit);
        }

        const feeLevels: Array<FeeLevel> = getFeeLevels(currentState.coinSymbol, currentState.gasPrice, gasLimit);
        const selectedFeeLevel: ?FeeLevel = feeLevels.find(f => f.value === currentState.selectedFeeLevel.value);
        if (!selectedFeeLevel) return;

        const state: State = {
            ...currentState,
            token: currency.value,
            amount,
            total,
            feeLevels,
            selectedFeeLevel,
            gasLimit,
        };

        dispatch({
            type: SEND.CURRENCY_CHANGE,
            state
        });
        dispatch( validation() );
    }
}



export const onSetMax = (): ThunkAction => {
    return (dispatch: Dispatch, getState: GetState): void => {
        const accountState: AccountState = getState().abstractAccount;
        const currentState: State = getState().sendForm;
        const isToken: boolean = currentState.token !== accountState.network;
        const touched = { ...currentState.touched };
        touched.amount = true;

        const account: ?Account = findAccount(getState().accounts, accountState.index, accountState.deviceState, accountState.network);
        if (!account) {
            // account not found
            return;
        }

        let amount: string = currentState.amount;
        let total: string = currentState.total;
        if (!currentState.setMax) {
            if (isToken) {
                const token: ?Token = findToken(getState().tokens, account.address, currentState.token, accountState.deviceState);
                if (!token) return;
                amount = token.balance;
                total = calculateTotal('0', currentState.gasPrice, currentState.gasLimit);
            } else {
                amount = calculateMaxAmount(account.balance, currentState.gasPrice, currentState.gasLimit);
                total = calculateTotal(amount, currentState.gasPrice, currentState.gasLimit);    
            }
        }

        const state: State = {
            ...currentState,
            untouched: false,
            touched,
            setMax: !currentState.setMax,
            amount,
            total
        };

        dispatch({
            type: SEND.SET_MAX,
            state
        });
        dispatch( validation() );
    }
}

export const onFeeLevelChange = (feeLevel: FeeLevel): ThunkAction => {
    return (dispatch: Dispatch, getState: GetState): void => {
        const accountState: AccountState = getState().abstractAccount;
        const currentState: State = getState().sendForm;
        const isToken: boolean = currentState.token !== accountState.network;

        const { config } = getState().localStorage;
        if (!config) return;
        const coin: ?Coin = config.coins.find(c => c.network === accountState.network);
        if (!coin) return;

        const state: State = {
            ...currentState,
            untouched: false,
            selectedFeeLevel: feeLevel,
        };

        if (feeLevel.value === 'Custom') {
            // TODO: update value for custom fee
            state.advanced = true;
            feeLevel.gasPrice = state.gasPrice;
            feeLevel.label = `${ calculateFee(state.gasPrice, state.gasLimit) } ${ state.coinSymbol }`;
        } else {
            const customLevel: ?FeeLevel = state.feeLevels.find(f => f.value === 'Custom');
            if (customLevel)
                customLevel.label = '';
            state.gasPrice = feeLevel.gasPrice;
            state.gasLimit = isToken ? coin.defaultGasLimitTokens.toString() : coin.defaultGasLimit.toString();
            // reset custom gasLimit
        }

        if (currentState.setMax) {
            const account: ?Account = findAccount(getState().accounts, accountState.index, accountState.deviceState, accountState.network);
            if (!account) return;

            if (isToken) {
                const token: ?Token = findToken(getState().tokens, account.address, currentState.token, accountState.deviceState);
                if (!token) return;
                state.amount = token.balance;
            } else {
                state.amount = calculateMaxAmount(account.balance, state.gasPrice, state.gasLimit);
            }
        }
        state.total = calculateTotal(isToken ? '0' : state.amount, state.gasPrice, state.gasLimit);

        dispatch({
            type: SEND.FEE_LEVEL_CHANGE,
            state
        });
        dispatch( validation() );
    }
}

export const updateFeeLevels = (): ThunkAction => {
    return (dispatch: Dispatch, getState: GetState): void => {
        const accountState: AccountState = getState().abstractAccount;
        const currentState: State = getState().sendForm;
        const isToken: boolean = currentState.token !== accountState.network;

        const feeLevels: Array<FeeLevel> = getFeeLevels(currentState.coinSymbol, currentState.recommendedGasPrice, currentState.gasLimit);
        const selectedFeeLevel: ?FeeLevel = feeLevels.find(f => f.value === currentState.selectedFeeLevel.value);
        if (!selectedFeeLevel) return;

        const state: State = {
            ...currentState,
            feeLevels,
            selectedFeeLevel,
            //gasPrice: currentState.recommendedGasPrice, // TODO HERE!
            gasPrice: selectedFeeLevel.gasPrice, // TODO HERE!
            gasPriceNeedsUpdate: false,
        };

        if (currentState.setMax) {
            const account: ?Account = findAccount(getState().accounts, accountState.index, accountState.deviceState, accountState.network);
            if (!account) return;
            if (isToken) {
                const token: ?Token = findToken(getState().tokens, account.address, state.token, accountState.deviceState);
                if (!token) return;
                const tokenBalance: string = token.balance;
                state.amount = tokenBalance;
            } else {
                state.amount = calculateMaxAmount(account.balance, state.gasPrice, state.gasLimit);
            }
        }
        state.total = calculateTotal(isToken ? '0' : state.amount, state.gasPrice, state.gasLimit);

        dispatch({
            type: SEND.UPDATE_FEE_LEVELS,
            state
        });
        dispatch( validation() );
    }
}

export const onGasPriceChange = (gasPrice: string): ThunkAction => {
    return (dispatch: Dispatch, getState: GetState): void => {
        const accountState: AccountState = getState().abstractAccount;
        const currentState: State = getState().sendForm;
        const isToken: boolean = currentState.token !== accountState.network;

        const touched = { ...currentState.touched };
        touched.gasPrice = true;

        const state: State = {
            ...currentState,
            untouched: false,
            touched,
            gasPrice: gasPrice,
        };

        if (gasPrice.match(numberRegExp) && state.gasLimit.match(numberRegExp)) {
            const customLevel = currentState.feeLevels.find(f => f.value === 'Custom');
            if (!customLevel) return;
            customLevel.gasPrice = gasPrice;
            customLevel.label = `${ calculateFee(gasPrice, state.gasLimit) } ${ state.coinSymbol }`;

            state.selectedFeeLevel = customLevel;

            if (currentState.setMax) {
                const account: ?Account = findAccount(getState().accounts, accountState.index, accountState.deviceState, accountState.network);
                if (!account) return;
                if (isToken) {
                    const token: ?Token = findToken(getState().tokens, account.address, state.token, accountState.deviceState);
                    if (!token) return;
                    const tokenBalance: string = token.balance;
                    state.amount = tokenBalance;
                } else {
                    state.amount = calculateMaxAmount(account.balance, state.gasPrice, state.gasLimit);
                }
            }
        }
        
        state.total = calculateTotal(isToken ? '0' : state.amount, state.gasPrice, state.gasLimit);

        dispatch({
            type: SEND.GAS_PRICE_CHANGE,
            state
        });
        dispatch( validation() );
    }
}

export const onGasLimitChange = (gasLimit: string): ThunkAction => {
    return (dispatch: Dispatch, getState: GetState): void => {
        const accountState: AccountState = getState().abstractAccount;
        const currentState: State = getState().sendForm;
        const isToken: boolean = currentState.token !== accountState.network;

        const touched = { ...currentState.touched };
        touched.gasLimit = true;

        const state: State = {
            ...currentState,
            untouched: false,
            touched,
            gasLimit,
        };

        if (gasLimit.match(numberRegExp) && state.gasPrice.match(numberRegExp)) {
            const customLevel: ?FeeLevel = state.feeLevels.find(f => f.value === 'Custom');
            if (!customLevel) return;
            customLevel.label = `${ calculateFee(currentState.gasPrice, gasLimit) } ${ state.coinSymbol }`;

            state.selectedFeeLevel = customLevel;

            if (state.setMax) {
                const account: ?Account = findAccount(getState().accounts, accountState.index, accountState.deviceState, accountState.network);
                if (!account) return;

                if (isToken) {
                    const token: ?Token = findToken(getState().tokens, account.address, state.token, accountState.deviceState);
                    if (!token) return;
                    const tokenBalance: string = token.balance;
                    state.amount = tokenBalance;
                } else {
                    state.amount = calculateMaxAmount(account.balance, state.gasPrice, state.gasLimit);
                }
            }
        }

        state.total = calculateTotal(isToken ? '0' : state.amount, state.gasPrice, state.gasLimit);

        dispatch({
            type: SEND.GAS_LIMIT_CHANGE,
            state
        });
        dispatch( validation() );
    }
}

export const onDataChange = (data: string): ThunkAction => {
    return (dispatch: Dispatch, getState: GetState): void => {
        const currentState: State = getState().sendForm;
        const touched = { ...currentState.touched };
        touched.data = true;

        const state: State = {
            ...currentState,
            untouched: false,
            touched,
            data,
        };

        dispatch({
            type: SEND.DATA_CHANGE,
            state
        });
        dispatch( validation() );
    }
}

export const onSend = (): AsyncAction => {
    //return onSendERC20();
    return async (dispatch: Dispatch, getState: GetState): Promise<any> => {

        const accountState: AccountState = getState().abstractAccount;
        const currentState: State = getState().sendForm;
        const web3instance: ?Web3Instance = getState().web3.filter(w3 => w3.network === accountState.network)[0];
        const account: ?Account = findAccount(getState().accounts, accountState.index, accountState.deviceState, accountState.network);
        if (!account || !web3instance) return;

        const isToken: boolean = currentState.token !== accountState.network;
        const web3 = web3instance.web3;
                
        const address_n = account.addressPath;

        let data: string = '';
        let txAmount: string = web3.toHex(web3.toWei(currentState.amount, 'ether'));
        let txAddress: string = currentState.address;
        if (isToken) {
            // const t = getState().tokens.find(t => t.ethAddress === account.address && t.symbol === currentState.token);
            const token: ?Token = findToken(getState().tokens, account.address, currentState.token, accountState.deviceState);
            if (!token) return;

            const contract = web3instance.erc20.at(token.address);
            data = contract.transfer.getData(currentState.address, currentState.amount, {
                from: account.address,
                gasLimit: currentState.gasLimit,
                gasPrice: currentState.gasPrice
            });
            txAmount = '0x00';
            txAddress = token.address;
        }

        const txData = {
            address_n,
            // from: currentAddress.address
            to: txAddress,
            value: txAmount,
            data,
            //chainId: 3 // ropsten
            chainId: web3instance.chainId,
            nonce: web3.toHex(account.nonce),
            gasLimit: web3.toHex(currentState.gasLimit),
            gasPrice: web3.toHex( EthereumjsUnits.convert(currentState.gasPrice, 'gwei', 'wei') ),
            r: '',
            s: '',
            v: ''
        }

        
        // const gasOptions = {
        //     to: txData.to,
        //     data: txData.data
        // }
        
        // const gasPrice = await getGasPrice(web3);

       

        // txData.nonce = web3.toHex(nonce);
        // txData.gasLimit = web3.toHex(gasLimit);
        // txData.gasPrice = web3.toHex( EthereumjsUnits.convert(gasPrice, 'gwei', 'wei') );

        // console.log("---->GASSS", txData, gasLimit, gasPrice, EthereumjsUnits.convert(gasPrice, 'gwei', 'wei'));

        const selected: ?TrezorDevice = findSelectedDevice(getState().connect);
        if (!selected) return;

        let signedTransaction = await TrezorConnect.ethereumSignTransaction({
            device: {
                path: selected.path,
                instance: selected.instance,
                state: selected.state
            },
            //path: "m/44'/60'/0'/0/0",
            path: txData.address_n,
            nonce: strip(txData.nonce),
            gasPrice: strip(txData.gasPrice),
            gasLimit: strip(txData.gasLimit),
            to: strip(txData.to),
            value: strip(txData.value),
            data: strip(txData.data),
            chainId: txData.chainId
        });

        if (!signedTransaction || !signedTransaction.success) {

            dispatch({
                type: NOTIFICATION.ADD,
                payload: {
                    type: 'error',
                    title: 'Transaction error',
                    message: signedTransaction.payload.error,
                    cancelable: true,
                    actions: [ ]
                }
            })
            return;
        }

        txData.r = '0x' + signedTransaction.payload.r;
        txData.s = '0x' + signedTransaction.payload.s;
        txData.v = web3.toHex(signedTransaction.payload.v);

        // const gasLimit2 = await estimateGas(web3, txData);
        // console.log("---->GASSS", txData, gasLimit2.toString() );

        const { config } = getState().localStorage;
        if (!config) return;
        const selectedCoin: ?Coin = config.coins.find(c => c.network === currentState.network);
        if (!selectedCoin) return;

        try {
            const tx = new EthereumjsTx(txData);
            const serializedTx = '0x' + tx.serialize().toString('hex');
            const txid = await pushTx(web3, serializedTx);

            dispatch({
                type: SEND.TX_COMPLETE,
                address: account,
                token: currentState.token,
                amount: currentState.amount,
                txid,
                txData,
            });

            dispatch({
                type: NOTIFICATION.ADD,
                payload: {
                    type: 'success',
                    title: 'Transaction success',
                    message: `<a href="${ selectedCoin.explorer }/tx/${txid}" class="green" target="_blank" rel="noreferrer noopener">See transaction detail</a>`,
                    cancelable: true,
                    actions: []
                }
            });

        } catch(error) {

            dispatch({
                type: NOTIFICATION.ADD,
                payload: {
                    type: 'error',
                    title: 'Transaction error',
                    message: error.message || error,
                    cancelable: true,
                    actions: [ ]
                }
            });
        }
    }
}

export default {
    init,
    update,
    dispose,

    toggleAdvanced,
    onAddressChange,
    onAmountChange,
    onCurrencyChange,
    onSetMax,
    onFeeLevelChange,
    updateFeeLevels,
    onGasPriceChange,
    onGasLimitChange,
    onDataChange,
    onSend,
}
