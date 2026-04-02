import type { CryptoId, ExchangeTrade, ExchangeTradeStatus } from 'invity-api';

import { invariant } from '@suite-common/suite-utils';
import { type Network } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { asAmountUnit, unitsToSubunits } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { getSerializedPath } from '@trezor/connect/src/utils/pathUtils';
import { BigNumber } from '@trezor/utils';

import { CONTRACT_ADDRESS_FOR_NATIVE_TOKEN } from '../../constants';
import { type ExchangeInfo } from '../../reducers/exchangeReducer';
import { type TradingExchangeAmountLimitProps } from '../../types';
import { cryptoIdToNetwork, getUnusedAddressFromAccount, parseCryptoId } from '../../utils';

type GetAmountLimitsProps = {
    quotes: ExchangeTrade[];
    currency: string;
};

export const isSendingEvmNativeToken = (cryptoId?: CryptoId) => {
    if (!cryptoId) {
        return false;
    }

    const isEvmNetwork = cryptoIdToNetwork(cryptoId)?.networkType === 'ethereum';
    const { contractAddress } = parseCryptoId(cryptoId);

    return (
        isEvmNetwork && (!contractAddress || contractAddress === CONTRACT_ADDRESS_FOR_NATIVE_TOKEN)
    );
};

// loop through quotes and if all quotes are either with error below minimum or over maximum, return error message
const getAmountLimits = ({
    quotes,
    currency,
}: GetAmountLimitsProps): TradingExchangeAmountLimitProps | undefined => {
    let min: number | undefined;
    let max: number | undefined;

    for (const quote of quotes) {
        let noError = true;
        const amount = Number(quote.sendStringAmount);
        if (amount && quote.min && amount < quote.min) {
            min = Math.min(min || 1e28, quote.min);
            noError = false;
        }
        if (amount && quote.max && quote.max !== 'NONE' && amount > quote.max) {
            max = Math.max(max || 0, quote.max);
            noError = false;
        }
        // if at least one quote succeeded do not return any message
        if (!quote.error && noError) {
            return;
        }
    }

    if (min || max) {
        return { currency, minCrypto: min?.toString(), maxCrypto: max?.toString() };
    }
};

const isQuoteError = (quote: ExchangeTrade): boolean => {
    if (
        quote.error ||
        !quote.receive ||
        !quote.receiveStringAmount ||
        !quote.sendStringAmount ||
        !quote.send
    ) {
        return true;
    }
    if (quote.min && Number(quote.sendStringAmount) < quote.min) {
        return true;
    }
    if (quote.max && quote.max !== 'NONE' && Number(quote.sendStringAmount) > quote.max) {
        return true;
    }

    return false;
};

const fixedRateCexQuotes = (quotes: ExchangeTrade[], exchangeInfo: ExchangeInfo | undefined) =>
    quotes.filter(
        q =>
            exchangeInfo?.providerInfos[q.exchange || '']?.isFixedRate &&
            !q.isDex &&
            !isQuoteError(q),
    );

const getSuccessQuotesOrdered = (quotes: ExchangeTrade[]): ExchangeTrade[] =>
    quotes.filter(q => !isQuoteError(q));

export const getStatusMessage = (status: ExchangeTradeStatus) => {
    switch (status) {
        case 'ERROR':
            return 'TR_EXCHANGE_STATUS_ERROR';
        case 'SUCCESS':
            return 'TR_EXCHANGE_STATUS_SUCCESS';
        case 'KYC':
            return 'TR_EXCHANGE_STATUS_KYC';
        case 'CONVERTING':
            return 'TR_EXCHANGE_STATUS_CONVERTING';
        default:
            return 'TR_EXCHANGE_STATUS_CONFIRMING';
    }
};

export const tokenSupportsIncreasingAllowance = (contractAddress?: string): boolean => {
    const ethereumUsdtContractAddress = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

    if (!contractAddress) {
        return false;
    }

    return contractAddress.trim().toLowerCase() !== ethereumUsdtContractAddress.toLowerCase();
};

export type ApprovalStatus =
    | 'approved'
    | 'needs_approval'
    | 'needs_increase'
    | 'needs_revoke'
    | 'not_needed'
    | null;

export const requiresTokenApproval = (quote?: ExchangeTrade): boolean =>
    !!quote && !!quote.isDex && !!quote.send && !isSendingEvmNativeToken(quote.send);

export const getApprovalStatus = (candidateQuote?: ExchangeTrade): ApprovalStatus => {
    if (!candidateQuote) {
        return null;
    }

    if (!requiresTokenApproval(candidateQuote)) {
        return 'not_needed';
    }

    const isApprovalTxPreApproved =
        candidateQuote.preapprovedStringAmount && candidateQuote.preapprovedStringAmount !== '0';

    if (isApprovalTxPreApproved && candidateQuote.status === 'APPROVAL_REQ') {
        // send is defined as requiresTokenApproval checks for it, but we need to assert it for TypeScript
        invariant(candidateQuote.send, 'candidateQuote.send not defined!');
        const { contractAddress } = parseCryptoId(candidateQuote.send);

        return tokenSupportsIncreasingAllowance(contractAddress)
            ? 'needs_increase'
            : 'needs_revoke';
    }

    if (isApprovalTxPreApproved) {
        return 'approved';
    }

    return 'needs_approval';
};

type DeriveBitcoinSwapFromAddressesParams = {
    account: Account;
    network: Network;
    sendStringAmount: string;
    decimals: number;
};

/**
 * Calculates the fromAddress for a Bitcoin swap transaction by simulating transaction composition.
 * This is necessary for some DEXes to provide accurate quotes.
 * It returns an array of addresses that would be used as inputs for the transaction.
 */
export const deriveBitcoinSwapFromAddresses = async ({
    account,
    network,
    sendStringAmount,
    decimals,
}: DeriveBitcoinSwapFromAddressesParams): Promise<string[] | undefined> => {
    const BITCOIN_SWAP_DUMMY_OP_RETURN_DATA =
        '3078306632656166663639313734646264333963366533346661366465653966326266626566663363313139366462303666636238356339313364376531663466643d7c6c6966696351';
    const BITCOIN_SWAP_DUMMY_FEE_PERCENTAGE = 2;

    if (!account.addresses || !account.utxo || !sendStringAmount) {
        return undefined;
    }

    // we need to use some address from the account as a placeholder for the simulation
    const { address: placeholderAddress } = getUnusedAddressFromAccount(account);
    const simulationAddress =
        placeholderAddress ||
        account.addresses.used[0]?.address ||
        account.addresses.change[0]?.address;

    if (!simulationAddress) {
        return undefined;
    }

    // we need to use utxos from the account for the simulation
    const usedAddressSet = new Set([
        ...account.addresses.used.map(a => a.address),
        ...account.addresses.change.map(a => a.address),
    ]);
    const usedUtxos = account.utxo.filter(u => usedAddressSet.has(u.address));

    if (usedUtxos.length === 0) {
        return undefined;
    }

    const amountSubunit = unitsToSubunits({
        value: asAmountUnit(new BigNumber(sendStringAmount)),
        decimals,
    });
    const feeAmount = amountSubunit
        .multipliedBy(BITCOIN_SWAP_DUMMY_FEE_PERCENTAGE / 100)
        .integerValue(BigNumber.ROUND_CEIL)
        .toString();

    const composeParams: Parameters<typeof TrezorConnect.composeTransaction>[0] = {
        outputs: [
            {
                type: 'payment',
                amount: amountSubunit.toString(),
                address: simulationAddress,
            },
            {
                type: 'opreturn',
                dataHex: BITCOIN_SWAP_DUMMY_OP_RETURN_DATA,
            },
            {
                type: 'payment',
                amount: feeAmount,
                address: simulationAddress,
            }, // 1. fee address
            {
                type: 'payment',
                amount: feeAmount,
                address: simulationAddress,
            }, // 2. fee address
        ],
        coin: network.symbol,
        account: {
            path: account.path,
            addresses: account.addresses,
            utxo: usedUtxos,
        },
        feeLevels: [{ feePerUnit: '1' }],
    };

    const precomposed = await TrezorConnect.composeTransaction(composeParams);

    if (precomposed.success && precomposed.payload.length > 0) {
        const tx = precomposed.payload[0];
        if (tx.type === 'final' || tx.type === 'nonfinal') {
            const addresses = await Promise.all(
                tx.inputs.map(i => {
                    if (!i.address_n) {
                        return undefined;
                    }
                    const path = getSerializedPath(i.address_n);

                    return usedUtxos.find(a => a.path === path)?.address;
                }),
            );

            return Array.from(new Set(addresses.filter((a): a is string => !!a)));
        }
    }

    return undefined;
};

export const exchangeUtils = {
    getAmountLimits,
    isQuoteError,
    fixedRateCexQuotes,
    getSuccessQuotesOrdered,
    getStatusMessage,
    tokenSupportsIncreasingAllowance,
    requiresTokenApproval,
    getApprovalStatus,
    deriveBitcoinSwapFromAddresses,
};
