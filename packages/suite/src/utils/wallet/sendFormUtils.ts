import { Output, State, EthTransactionData, EthPreparedTransaction } from '@wallet-types/sendForm';
import { Account } from '@wallet-types';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import BigNumber from 'bignumber.js';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { toHex, toWei } from 'web3-utils';
import { Transaction } from 'ethereumjs-tx';

export const getOutput = (outputs: Output[], id: number) =>
    outputs.find(outputItem => outputItem.id === id) as Output;

export const hasDecimals = (value: string, decimals: number) => {
    const DECIMALS_REGEX = new RegExp(
        `^(0|0\\.([0-9]{0,${decimals}})?|[1-9][0-9]*\\.?([0-9]{0,${decimals}})?)$`,
    );
    return DECIMALS_REGEX.test(value);
};

export const shouldComposeBy = (name: 'address' | 'amount', outputs: Output[]) => {
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

    // one of the inputs is not valid
    outputs.forEach(output => {
        if (output[name].error) {
            shouldCompose = false;
        }
    });

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

export const calculateMax = (balance: string, fee: string): string => {
    try {
        const balanceBig = new BigNumber(balance);
        // TODO - minus pendings
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
    if (!isMandatory && !value) return undefined;

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
        token: null,
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
    const ethTx = new Transaction(tx, { chain: tx.chainId });
    return `0x${ethTx.serialize().toString('hex')}`;
};

export const getReserveInXrp = (account: Account) => {
    if (account.networkType !== 'ripple') return null;
    const { misc } = account;
    return formatNetworkAmount(misc.reserve, account.symbol);
};
