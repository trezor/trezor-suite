import type { TokenInfo } from '@trezor/blockchain-link-types';
import type {
    EthereumTransaction,
    EthereumTransactionEIP1559,
    PROTO,
} from '@trezor/connect-common';
import {
    type ExternalComposeOutput,
    convertAmountUnitsToSubunits,
    findToken,
} from '@trezor/network-module-suite-common-types';
import { BigNumber } from '@trezor/utils';

import { fromEther, fromGwei, fromIntegerString } from './ethConverter';
import { ERC20_TRANSFER } from './evmConstants';
import { isEvmApprovalTx, sanitizeHex, strip } from './evmHex';

export type EthTransactionData = {
    token?: TokenInfo;
    chainId: number;
    to: string;
    amount: string;
    data?: string;
    gasLimit: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    nonce: string;
    payment_req?: PROTO.PaymentRequest;
};

/**
 * Calculate the EVM fee from gas price / max fee and gas limit.
 * @param {string} [gasPriceInWei] - The gas price in wei.
 * @param {string} [gasLimit] - The gas limit.
 * @returns {string} The calculated fee in wei, or '0' if inputs are invalid.
 */
export const calculateTotalGasCost = (gasPriceInWei?: string, gasLimit?: string): string => {
    if (!gasPriceInWei || !gasLimit) {
        return '0';
    }

    const gasPriceBN = new BigNumber(gasPriceInWei);
    const gasLimitBN = new BigNumber(gasLimit);

    if (gasPriceBN.isNaN() || gasLimitBN.isNaN()) {
        return '0';
    }

    const fee = gasPriceBN.times(gasLimitBN);

    if (fee.isNaN()) {
        return '0';
    }

    return fee.toFixed();
};

const getSerializedAmount = (amount?: string) => (amount ? fromEther(amount).toWei('hex') : '0x00');

const getSerializedErc20Transfer = (token: TokenInfo, to: string, amount: string) => {
    // 32 bytes address parameter, remove '0x' prefix
    const erc20recipient = strip(to).padStart(64, '0');
    // convert amount to satoshi
    const tokenAmount = convertAmountUnitsToSubunits(amount, token.decimals);
    // 32 bytes amount paramter, remove '0x' prefix
    const erc20amount = fromIntegerString(tokenAmount).toHex().substring(2).padStart(64, '0');

    // join data
    return `0x${ERC20_TRANSFER}${erc20recipient}${erc20amount}`;
};

// TrezorConnect.blockchainEstimateFee for ETH
export const getEthereumEstimateFeeParams = (
    to: string,
    amount: string,
    token?: TokenInfo,
    data?: string,
) => {
    if (token) {
        // use the data if provided
        if (data) {
            return {
                to,
                value: '0x0',
                data,
            };
        }

        // otherwise compose basic ERC-20 token transfer data
        return {
            to: token.contract,
            value: '0x0',
            data: getSerializedErc20Transfer(token, to, amount),
        };
    }

    return {
        to,
        value: getSerializedAmount(amount),
        data: data || '',
    };
};

export const prepareEthereumTransaction = (
    txInfo: EthTransactionData,
): EthereumTransaction | EthereumTransactionEIP1559 => {
    let result: EthereumTransaction | EthereumTransactionEIP1559;

    const commonTxData = {
        to: txInfo.to,
        value: getSerializedAmount(txInfo.amount),
        chainId: txInfo.chainId,
        nonce: fromIntegerString(txInfo.nonce).toHex(),
        gasLimit: fromIntegerString(txInfo.gasLimit).toHex(),
        payment_req: txInfo.payment_req,
    };

    if (txInfo.maxFeePerGas) {
        result = {
            ...commonTxData,
            gasPrice: undefined,
            maxFeePerGas: fromGwei(txInfo.maxFeePerGas).toWei('hex'),
            maxPriorityFeePerGas: fromGwei(txInfo.maxPriorityFeePerGas || '0').toWei('hex'),
        } satisfies EthereumTransactionEIP1559;
    } else if (txInfo.gasPrice) {
        result = {
            ...commonTxData,
            gasPrice: fromGwei(txInfo.gasPrice).toWei('hex'),
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined,
        } satisfies EthereumTransaction;
    } else {
        throw new Error('No gas price or maxFeePerGas and maxPriorityFeePerGas provided');
    }

    if (!txInfo.token && txInfo.data) {
        result.data = sanitizeHex(txInfo.data);
    }

    if (txInfo.token) {
        const isApprovalTx = isEvmApprovalTx(txInfo.data);

        if (txInfo.data && txInfo.data !== '0x' && !isApprovalTx) {
            result.data = sanitizeHex(txInfo.data);
        } else {
            result.data = isApprovalTx
                ? txInfo.data
                : getSerializedErc20Transfer(txInfo.token, txInfo.to, txInfo.amount);
            result.to = txInfo.token.contract;
        }
        result.value = '0x00';
    }

    return result;
};

/** An ERC-20 approval: a zero-value call to the token contract. */
export const getApprovalComposeOutput = <TToken extends TokenInfo>(
    contract: string | undefined,
    account: { readonly tokens?: readonly TToken[] },
    network: { readonly decimals: number },
): ExternalComposeOutput<TToken> | undefined => {
    if (!contract) {
        return undefined;
    }

    const tokenInfo = findToken(account.tokens, contract);
    const decimals = tokenInfo ? tokenInfo.decimals : network.decimals;

    return {
        output: {
            address: contract,
            amount: '0',
            type: 'payment',
        },
        tokenInfo,
        decimals,
    };
};
