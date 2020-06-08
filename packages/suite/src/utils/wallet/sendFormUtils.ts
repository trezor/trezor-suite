import { ERC20_GAS_LIMIT, ERC20_TRANSFER, VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { SendContext } from '@wallet-hooks/useSendContext';
import { Account, Network } from '@wallet-types';
import { EthTransactionData, FeeInfo, FeeLevel, Output } from '@wallet-types/sendForm';
import {
    amountToSatoshi,
    formatNetworkAmount,
    networkAmountToSatoshi,
} from '@wallet-utils/accountUtils';
import BigNumber from 'bignumber.js';
import Common from 'ethereumjs-common';
import { Transaction, TxData } from 'ethereumjs-tx';
import { FieldError, NestDataObject } from 'react-hook-form';
import TrezorConnect, { EthereumTransaction } from 'trezor-connect';
import { fromWei, padLeft, toHex, toWei } from 'web3-utils';

export const getOutput = (outputs: Output[], id: number) =>
    outputs.find(outputItem => outputItem.id === id);

export const hasDecimals = (value: string, decimals: number) => {
    const DECIMALS_REGEX = new RegExp(
        `^(0|0\\.([0-9]{0,${decimals}})?|[1-9][0-9]*\\.?([0-9]{0,${decimals}})?)$`,
    );
    return DECIMALS_REGEX.test(value);
};

export const shouldComposeBy = (
    name: 'address' | 'amount',
    outputs: Output[],
    networkType: Account['networkType'],
) => {
    let shouldCompose = true;
    const results = [];

    // check if there is at least one filled
    outputs.forEach(output => {
        if (output[name].value) {
            results.push(output[name].value);
        }
    });

    if (results.length === 0) {
        shouldCompose = false;
    }

    if (networkType !== 'bitcoin') {
        // one of the inputs is not valid
        outputs.forEach(output => {
            if (output[name].error) {
                shouldCompose = false;
            }
        });
    }

    return shouldCompose;
};

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

export const getInputState = (
    error: typeof VALIDATION_ERRORS[keyof typeof VALIDATION_ERRORS] | null,
    value: string | null,
    noSuccess?: boolean,
    isMandatory?: boolean,
) => {
    if (!isMandatory && !value) {
        return undefined;
    }

    if (error) {
        return 'error';
    }

    if (noSuccess) {
        return undefined;
    }

    if (value && !error) {
        return 'success';
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

export const getState = (
    error: NestDataObject<Record<string, any>, FieldError>,
    touched?: boolean,
) => {
    if (touched && !error) {
        return 'success';
    }

    if (error) {
        return 'error';
    }

    return undefined;
};

export const composeXrpTransaction = (
    account: SendContext['account'],
    amount: string,
    selectedFee: SendContext['selectedFee'],
) => {
    const { symbol, availableBalance } = account;
    const amountInSatoshi = networkAmountToSatoshi(amount, symbol).toString();
    const feeInSatoshi = selectedFee.feePerUnit;
    const totalSpentBig = new BigNumber(calculateTotal(amountInSatoshi, feeInSatoshi));
    const max = new BigNumber(calculateMax(availableBalance, feeInSatoshi));
    const payloadData = {
        totalSpent: totalSpentBig.toString(),
        fee: feeInSatoshi,
        max: max.isLessThan('0') ? '' : formatNetworkAmount(max.toFixed(), 'xrp'),
    };

    if (totalSpentBig.isGreaterThan(availableBalance)) {
        return { type: 'error', error: 'NOT-ENOUGH-FUNDS' } as const;
    }

    return { type: 'final', ...payloadData } as const;
};

export const composeEthTransaction = (
    account: SendContext['account'],
    amount: string,
    selectedFee: SendContext['selectedFee'],
    token: SendContext['token'],
    setMax = false,
) => {
    const isFeeValid = !new BigNumber(selectedFee.feePerUnit).isNaN();

    const { availableBalance } = account;
    const feeInSatoshi = calculateEthFee(
        toWei(isFeeValid ? selectedFee.feePerUnit : '0', 'gwei'),
        selectedFee.feeLimit || '0',
    );
    const max = token
        ? new BigNumber(token.balance!)
        : new BigNumber(calculateMax(availableBalance, feeInSatoshi));
    // use max possible value or input.value
    // race condition when switching between tokens with set-max enabled
    // input still holds previous value (previous token max)
    const amountInSatoshi = setMax
        ? max.toString()
        : networkAmountToSatoshi(amount, account.symbol).toString();
    const totalSpentBig = new BigNumber(
        calculateTotal(token ? '0' : amountInSatoshi, feeInSatoshi),
    );
    const payloadData = {
        totalSpent: totalSpentBig.toString(),
        fee: feeInSatoshi,
        feePerUnit: selectedFee.feePerUnit,
        max: max.isLessThan('0') ? '' : formatNetworkAmount(max.toFixed(), 'eth'),
    };

    if (totalSpentBig.isGreaterThan(availableBalance)) {
        const error = token ? 'NOT-ENOUGH-CURRENCY-FEE' : 'NOT-ENOUGH-FUNDS';
        return { type: 'error', error } as const;
    }

    return { type: 'final', ...payloadData } as const;
};

export const composeBtcTransaction = async (
    account: Account,
    formValues: any,
    outputs: SendContext['outputs'],
    selectedFee: SendContext['selectedFee'],
    setMax = false,
) => {
    if (!account.addresses || !account.utxo) return;

    const composedOutputs = outputs.map(output => {
        const amount = networkAmountToSatoshi(formValues[`amount-${output.id}`], account.symbol);
        const address = formValues[`address-${output.id}`];

        // address is set
        if (address) {
            // set max without address
            if (setMax) {
                return {
                    address,
                    type: 'send-max',
                } as const;
            }

            return {
                address,
                amount,
            } as const;
        }

        // set max with address only
        if (setMax) {
            return {
                type: 'send-max-noaddress',
            } as const;
        }

        // set amount without address
        return {
            type: 'noaddress',
            amount,
        } as const;
    });

    const resp = await TrezorConnect.composeTransaction({
        account: {
            path: account.path,
            addresses: account.addresses,
            utxo: account.utxo,
        },
        feeLevels: [selectedFee],
        outputs: composedOutputs,
        coin: account.symbol,
    });

    if (resp.success) {
        return resp.payload[0];
    }
};
