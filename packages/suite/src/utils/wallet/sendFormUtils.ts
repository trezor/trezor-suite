import { ERC20_GAS_LIMIT, ERC20_TRANSFER } from '@wallet-constants/sendForm';
import { SendContext, FeeInfo, EthTransactionData } from '@wallet-hooks/useSendContext';
import { Account, Network } from '@wallet-types';
import {
    composeRippleTransaction,
    composeEthereumTransaction,
    composeBitcoinTransaction,
} from '@wallet-actions/sendFormActions';
import { amountToSatoshi, formatNetworkAmount } from '@wallet-utils/accountUtils';
import BigNumber from 'bignumber.js';
import Common from 'ethereumjs-common';
import { Transaction, TxData } from 'ethereumjs-tx';
import { FieldError, NestDataObject, useForm } from 'react-hook-form';
import { EthereumTransaction, FeeLevel } from 'trezor-connect';
import { fromWei, padLeft, toHex, toWei } from 'web3-utils';

export const calculateTotal = (amount: string, fee: string): string => {
    try {
        const bAmount = new BigNumber(amount);
        if (bAmount.isNaN()) {
            console.error('Amount is not a number');
        }
        return bAmount.plus(fee).toString();
    } catch (error) {
        return '0';
    }
};

export const calculateMax = (availableBalance: string, fee: string): string => {
    try {
        const balanceBig = new BigNumber(availableBalance);
        const max = balanceBig.minus(fee);
        if (max.isLessThan(0)) return '0';
        return max.toFixed();
    } catch (error) {
        return '0';
    }
};

// ETH SPECIFIC

const padLeftEven = (hex: string): string => (hex.length % 2 !== 0 ? `0${hex}` : hex);

export const sanitizeHex = ($hex: string): string => {
    const hex = $hex.toLowerCase().substring(0, 2) === '0x' ? $hex.substring(2) : $hex;
    if (hex === '') return '';
    return `0x${padLeftEven(hex)}`;
};

/*
    Calculate fee from gas price and gas limit
 */
export const calculateEthFee = (gasPrice: string | null, gasLimit: string | null): string => {
    if (!gasPrice || !gasLimit) {
        return '0';
    }
    try {
        return new BigNumber(gasPrice).times(gasLimit).toFixed();
    } catch (error) {
        // TODO: empty input throws this error.
        return '0';
    }
};

export const prepareEthereumTransaction = (txInfo: EthTransactionData) => {
    const result: EthereumTransaction = {
        to: txInfo.to,
        value: toHex(toWei(txInfo.amount, 'ether')),
        chainId: txInfo.chainId,
        nonce: toHex(txInfo.nonce),
        gasLimit: toHex(txInfo.gasLimit),
        gasPrice: toHex(toWei(txInfo.gasPrice, 'gwei')),
    };

    if (!txInfo.token && txInfo.data) {
        result.data = sanitizeHex(txInfo.data);
    }

    // Build erc20 'transfer' method
    if (txInfo.token) {
        // 32 bytes address parameter, remove '0x' prefix
        const erc20recipient = padLeft(txInfo.to, 64).substring(2);
        // convert amount to satoshi
        const tokenAmount = amountToSatoshi(txInfo.amount, txInfo.token.decimals);
        // 32 bytes amount paramter, remove '0x' prefix
        const erc20amount = padLeft(toHex(tokenAmount), 64).substring(2);
        // join data
        result.data = `0x${ERC20_TRANSFER}${erc20recipient}${erc20amount}`;
        // replace tx recipient to smart contract address
        result.to = txInfo.token.address;
        // replace tx value
        result.value = '0x00';
    }

    return result;
};

export const serializeEthereumTx = (tx: TxData & EthereumTransaction) => {
    // ethereumjs-tx doesn't support ETC (chain 61) by default
    // and it needs to be declared as custom chain
    // see: https://github.com/ethereumjs/ethereumjs-tx/blob/master/examples/custom-chain-tx.ts
    const options =
        tx.chainId === 61
            ? {
                  common: Common.forCustomChain(
                      'mainnet',
                      {
                          name: 'ethereum-classic',
                          networkId: 1,
                          chainId: 61,
                      },
                      'petersburg',
                  ),
              }
            : {
                  chain: tx.chainId,
              };

    const ethTx = new Transaction(tx, options);
    return `0x${ethTx.serialize().toString('hex')}`;
};

export const getReserveInXrp = (account: Account) => {
    if (account.networkType !== 'ripple') return null;
    const { misc } = account;
    return formatNetworkAmount(misc.reserve, account.symbol);
};

export const getFeeLevels = (
    networkType: Network['networkType'],
    feeInfo: FeeInfo,
    token = false,
) => {
    const convertedEthLevels: FeeLevel[] = [];
    const initialLevels: FeeLevel[] = feeInfo.levels.concat({
        label: 'custom',
        feePerUnit: '0',
        blocks: -1,
    });

    if (networkType === 'ethereum') {
        initialLevels.forEach(level =>
            convertedEthLevels.push({
                ...level,
                feePerUnit: fromWei(level.feePerUnit, 'gwei'),
                feeLimit: token ? ERC20_GAS_LIMIT : level.feeLimit,
                feePerTx: token
                    ? new BigNumber(ERC20_GAS_LIMIT).times(level.feePerUnit).toString()
                    : level.feePerTx,
            }),
        );
    }

    return networkType === 'ethereum' ? convertedEthLevels : initialLevels;
};

export const getInputState = (
    error: NestDataObject<Record<string, any>, FieldError>,
    isDirty?: boolean,
) => {
    if (error) {
        return 'error';
    }

    if (isDirty && !error) {
        return 'success';
    }
};

export const composeTx = async (
    account: Account,
    getValues: ReturnType<typeof useForm>['getValues'],
    selectedFee: SendContext['selectedFee'],
    outputs: SendContext['outputs'],
    token: SendContext['token'],
    setMax = false,
): Promise<any> => {
    if (account.networkType === 'ripple') {
        return composeRippleTransaction(account, getValues, selectedFee);
    }

    if (account.networkType === 'ethereum') {
        return composeEthereumTransaction(account, getValues, selectedFee, token, setMax);
    }

    if (account.networkType === 'bitcoin') {
        return composeBitcoinTransaction(account, outputs, getValues, selectedFee);
    }
};

export const updateFiatInput = (
    id: number,
    fiatRates: SendContext['fiatRates'],
    getValues: ReturnType<typeof useForm>['getValues'],
    setValue: ReturnType<typeof useForm>['setValue'],
) => {
    if (fiatRates) {
        const localCurrency = getValues(`localCurrency[${id}]`);
        const rate = fiatRates.current?.rates[localCurrency.value];

        if (rate) {
            const oldValue = getValues(`amount[${id}]`);
            const fiatValueBigNumber = new BigNumber(oldValue).multipliedBy(new BigNumber(rate));
            const fiatValue = fiatValueBigNumber.isNaN() ? '' : fiatValueBigNumber.toFixed(2);
            setValue(`fiatInput[${id}]`, fiatValue);
        }
    }
};

export const getFiatRate = (fiatRates: SendContext['fiatRates'], currency: string) => {
    if (fiatRates) {
        return fiatRates.current?.rates[currency] || null;
    }

    return null;
};

export const buildCurrencyOption = (currency: string) => {
    return { value: currency, label: currency.toUpperCase() };
};

export const composeChange = async (
    id: number,
    account: Account,
    setTransactionInfo: SendContext['setTransactionInfo'],
    getValues: ReturnType<typeof useForm>['getValues'],
    setError: ReturnType<typeof useForm>['setError'],
    selectedFee: FeeLevel,
    outputs: SendContext['outputs'],
    token: SendContext['token'],
) => {
    const setMaxActive = getValues(`setMax[${id}]`) === 'active';
    const composedTransaction = await composeTx(
        account,
        getValues,
        selectedFee,
        outputs,
        token,
        setMaxActive,
    );

    if (!composedTransaction) return null; // TODO handle error

    if (composedTransaction.error) {
        switch (composedTransaction.error) {
            case 'NOT-ENOUGH-FUNDS':
                setError(`amount${id}]`, 'TR_AMOUNT_IS_NOT_ENOUGH');
                break;
            case 'NOT-ENOUGH-CURRENCY-FEE':
                setError(`amount[${id}]`, 'NOT_ENOUGH_CURRENCY_FEE');
                break;
            // no default
        }
    }

    setTransactionInfo(composedTransaction);
};

const resetAllMax = (
    outputs: SendContext['outputs'],
    setValue: ReturnType<typeof useForm>['setValue'],
) => {
    outputs.map(output => setValue(`setMax[${output.id}]`, 'inactive'));
};

export const findActiveMaxId = (
    outputs: SendContext['outputs'],
    getValues: ReturnType<typeof useForm>['getValues'],
): number | null => {
    let maxId = null;
    outputs.forEach(output => {
        if (getValues(`setMax[${output.id}]`) === 'active') {
            maxId = output.id;
        }
    });

    return maxId;
};

export const updateMax = async (
    id: number | null,
    account: Account,
    setValue: ReturnType<typeof useForm>['setValue'],
    getValues: ReturnType<typeof useForm>['getValues'],
    clearError: ReturnType<typeof useForm>['clearError'],
    setError: ReturnType<typeof useForm>['setError'],
    selectedFee: FeeLevel,
    outputs: SendContext['outputs'],
    token: SendContext['token'],
    fiatRates: SendContext['fiatRates'],
    setTransactionInfo: SendContext['setTransactionInfo'],
) => {
    if (id === null) return;

    resetAllMax(outputs, setValue);
    setValue(`setMax[${id}]`, 'active');
    const composedTransaction = await composeTx(
        account,
        getValues,
        selectedFee,
        outputs,
        token,
        getValues(`setMax[${id}]`) === 'active',
    );

    if (!composedTransaction) {
        setError(`amount[${id}]`, 'TR_SEND_COMPOSE_ERROR');
        return;
    }

    if (composedTransaction.type === 'error' || composedTransaction.error) {
        switch (composedTransaction.error) {
            case 'NOT-ENOUGH-FUNDS':
                setError(`amount[${id}]`, 'TR_AMOUNT_IS_NOT_ENOUGH');
                break;
            case 'NOT-ENOUGH-CURRENCY-FEE':
                setError(`amount[${id}]`, 'NOT_ENOUGH_CURRENCY_FEE');
                break;
            default:
                setError(`amount[${id}]`, 'TR_SEND_COMPOSE_ERROR');
                break;
            // no default
        }
        return;
    }

    if (composedTransaction && composedTransaction.error !== null) {
        clearError(`amount[${id}]`);
        setValue(`amount[${id}]`, composedTransaction.max);
        updateFiatInput(id, fiatRates, getValues, setValue);
        await composeChange(
            id,
            account,
            setTransactionInfo,
            getValues,
            setError,
            selectedFee,
            outputs,
            token,
        );
    }
};
