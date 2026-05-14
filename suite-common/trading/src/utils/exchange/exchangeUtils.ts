import type { CryptoId, ExchangeTrade, ExchangeTradeStatus, InfoResponse } from 'invity-api';

import { invariant } from '@suite-common/suite-utils';
import { type Network } from '@suite-common/wallet-config';
import { type Account, type GeneralPrecomposedLevels } from '@suite-common/wallet-types';
import {
    asAmountUnit,
    buildApprovalTransactionData,
    getErc20ApproveSpender,
    tokenSupportsIncreasingAllowance,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';
import { BigNumber } from '@trezor/utils';

import { CONTRACT_ADDRESS_FOR_NATIVE_TOKEN } from '../../constants';
import { type ExchangeInfo } from '../../reducers/exchangeReducer';
import { type TradingExchangeAmountLimitProps } from '../../types';
import { cryptoIdToNetwork, getUnusedAddressFromAccount, parseCryptoId } from '../../utils';

export { tokenSupportsIncreasingAllowance };

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

export type ApprovalStatus =
    'approved' | 'needs_approval' | 'needs_increase' | 'needs_revoke' | 'not_needed' | null;

export const hasEip712SignDataType = (quote?: ExchangeTrade): boolean =>
    quote?.signData?.type === 'eip712-typed-data';

export const hasEip712SignData = (quote?: ExchangeTrade) =>
    quote?.status === 'SIGN_DATA' && hasEip712SignDataType(quote);

export const requiresTokenApproval = (quote?: ExchangeTrade): boolean =>
    !!quote &&
    !!quote.isDex &&
    !!quote.send &&
    !isSendingEvmNativeToken(quote.send) &&
    !hasEip712SignData(quote);

export const getDisplayNetworkFee = (
    quote: ExchangeTrade | undefined,
    fee: string | undefined,
): string | undefined => (hasEip712SignDataType(quote) ? '0' : fee);

export const getDisplayComposedLevels = <T extends GeneralPrecomposedLevels>(
    quote: ExchangeTrade | undefined,
    composedLevels: T | undefined,
): T | undefined => {
    if (composedLevels && hasEip712SignDataType(quote)) {
        return Object.fromEntries(
            Object.entries(composedLevels).map(([label, level]) => [
                label,
                level.type === 'error' ? { type: 'nonfinal', fee: '0' } : { ...level, fee: '0' },
            ]),
        ) as T;
    }

    return composedLevels;
};

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

export const getDexEstimationData = (quote: ExchangeTrade): string | undefined => {
    if (!quote.dexTx?.data) {
        return undefined;
    }

    if (getApprovalStatus(quote) === 'needs_revoke') {
        const spender = getErc20ApproveSpender(quote.dexTx.data);
        if (spender) {
            try {
                return buildApprovalTransactionData({ spender, amount: '0' });
            } catch {
                return quote.dexTx.data;
            }
        }
    }

    return quote.dexTx.data;
};

type DeriveBitcoinSwapFromAddressesParams = {
    account: Account;
    network: Network;
    sendStringAmount: string;
    decimals: number;
    setMaxOutputId?: number;
    feePerUnit?: string;
    btcSwapDummyData?: InfoResponse['config']['btcSwapDummyData'];
};

/**
 * Calculates the fromAddress for a Bitcoin swap by simulating composition with dummy
 * OP_RETURN and fee outputs. Some DEXes need the input addresses for accurate quotes.
 */
export const deriveBitcoinSwapFromAddresses = async ({
    account,
    network,
    sendStringAmount,
    decimals,
    setMaxOutputId,
    feePerUnit,
    btcSwapDummyData,
}: DeriveBitcoinSwapFromAddressesParams): Promise<
    { addresses: string[]; amount?: string } | undefined
> => {
    if (!btcSwapDummyData) {
        return undefined;
    }

    if (
        !account.addresses ||
        !account.utxo ||
        (!sendStringAmount && setMaxOutputId === undefined)
    ) {
        return undefined;
    }

    const { address: placeholderAddress } = getUnusedAddressFromAccount(account);
    const simulationAddress =
        placeholderAddress ||
        account.addresses.used[0]?.address ||
        account.addresses.change[0]?.address;

    if (!simulationAddress) {
        return undefined;
    }

    const usedAddressSet = new Set([
        ...account.addresses.used.map(a => a.address),
        ...account.addresses.change.map(a => a.address),
    ]);
    const usedUtxos = account.utxo.filter(u => usedAddressSet.has(u.address));

    if (usedUtxos.length === 0) {
        return undefined;
    }

    const amountSubunitRaw = sendStringAmount
        ? unitsToSubunits({
              value: asAmountUnit(new BigNumber(sendStringAmount)),
              decimals,
          })
        : new BigNumber(account.availableBalance);

    const feeAmount = amountSubunitRaw
        .multipliedBy(btcSwapDummyData.feePercentage / 100)
        .integerValue(BigNumber.ROUND_CEIL)
        .toString();

    const amountSubunit = amountSubunitRaw.toString();

    const composeParams: Parameters<typeof TrezorConnect.composeTransaction>[0] = {
        outputs: [
            setMaxOutputId === 0
                ? {
                      type: 'send-max',
                      address: simulationAddress,
                  }
                : {
                      type: 'payment',
                      amount: amountSubunit,
                      address: simulationAddress,
                  },
            {
                type: 'opreturn',
                dataHex: btcSwapDummyData.opreturn.dataHex,
            },
            {
                type: 'payment',
                amount: feeAmount,
                address: simulationAddress,
            },
            {
                type: 'payment',
                amount: feeAmount,
                address: simulationAddress,
            },
        ],
        coin: asCoinSymbol(network.symbol),
        account: {
            path: account.path,
            addresses: account.addresses,
            utxo: usedUtxos,
        },
        feeLevels: [{ feePerUnit: feePerUnit || '1' }],
    };

    const precomposed = await TrezorConnect.composeTransaction(composeParams);

    if (!precomposed.success || precomposed.payload.length === 0) {
        return undefined;
    }

    const tx = precomposed.payload[0];
    if (!tx || (tx.type !== 'final' && tx.type !== 'nonfinal')) {
        return undefined;
    }

    const inputAddresses = Array.from(
        new Set(
            tx.inputs
                .map(
                    input =>
                        usedUtxos.find(
                            utxo => utxo.txid === input.prev_hash && utxo.vout === input.prev_index,
                        )?.address,
                )
                .filter((address): address is string => !!address),
        ),
    );
    const firstOutputAmount =
        'outputs' in tx && tx.outputs[0]?.amount ? tx.outputs[0].amount.toString() : undefined;

    return { addresses: inputAddresses, amount: firstOutputAmount };
};

export const exchangeUtils = {
    getAmountLimits,
    isQuoteError,
    fixedRateCexQuotes,
    getSuccessQuotesOrdered,
    getStatusMessage,
    tokenSupportsIncreasingAllowance,
    hasEip712SignDataType,
    hasEip712SignData,
    requiresTokenApproval,
    getApprovalStatus,
    getDexEstimationData,
    getDisplayNetworkFee,
    getDisplayComposedLevels,
    deriveBitcoinSwapFromAddresses,
};
