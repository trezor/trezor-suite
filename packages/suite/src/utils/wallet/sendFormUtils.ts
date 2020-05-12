import {
    Output,
    State,
    EthTransactionData,
    EthPreparedTransaction,
    FeeInfo,
    FeeLevel,
} from '@wallet-types/sendForm';
import { Account, Network } from '@wallet-types';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import BigNumber from 'bignumber.js';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { toHex, toWei, fromWei } from 'web3-utils';
import { Transaction } from 'ethereumjs-tx';
import Common from 'ethereumjs-common'; // this is a dependency of `ethereumjs-tx` therefore it doesn't have to be in package.json

export const getOutput = (outputs: Output[], id: number) =>
    outputs.find(outputItem => outputItem.id === id) as Output;

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

export const getTransactionInfo = (networkType: Account['networkType'], send: State) => {
    switch (networkType) {
        case 'bitcoin': {
            return send.networkTypeBitcoin.transactionInfo;
        }
        case 'ethereum': {
            return send.networkTypeEthereum.transactionInfo;
        }
        case 'ripple': {
            return send.networkTypeRipple.transactionInfo;
        }
        // no default
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
    // todo ERC20 support
    const result: EthPreparedTransaction = {
        to: txInfo.to,
        value: toHex(toWei(txInfo.amount, 'ether')),
        chainId: txInfo.chainId,
        nonce: toHex(txInfo.nonce),
        gasLimit: toHex(txInfo.gasLimit),
        gasPrice: toHex(toWei(txInfo.gasPrice, 'gwei')),
        r: '',
        s: '',
        v: '',
    };

    if (txInfo.data) {
        result.data = sanitizeHex(txInfo.data);
    }

    return result;
};

export const serializeEthereumTx = (tx: any) => {
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

export const getFeeLevels = (networkType: Network['networkType'], feeInfo: FeeInfo) => {
    const convertedEthLevels: FeeLevel[] = [];
    const initialLevels: FeeLevel[] =
        networkType === 'ethereum'
            ? feeInfo.levels
            : feeInfo.levels.concat({
                  label: 'custom',
                  feePerUnit: '0',
                  blocks: -1,
              });

    if (networkType === 'ethereum') {
        initialLevels.forEach(level =>
            convertedEthLevels.push({
                ...level,
                feePerUnit: fromWei(level.feePerUnit, 'gwei'),
            }),
        );
    }

    return networkType === 'ethereum' ? convertedEthLevels : initialLevels;
};
