import { type ExchangeTrade } from 'invity-api';

import { ETHEREUM_ADJUST_GAS_LIMIT } from '@suite-common/wallet-core';
import { asAmountUnit, unitsToSubunits } from '@suite-common/wallet-utils';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { type RecomposeAndSignTxThunkProps } from './recomposeAndSignTxThunk';

export type RecomposeInputs = Pick<
    RecomposeAndSignTxThunkProps,
    | 'address'
    | 'amount'
    | 'destinationTag'
    | 'transactionData'
    | 'ethereumAdjustGasLimit'
    | 'recalculateCustomLimit'
>;

export type TradeRecomposeInput =
    // Exchange CEX trade.
    | {
          sendAddress: string;
          sendStringAmount: string;
          partnerPaymentExtraId: string | undefined;
          shouldSendInSats: boolean | undefined;
          decimals: number;
      }
    // Exchange DEX trade.
    | {
          dexTx: NonNullable<ExchangeTrade['dexTx']>;
          partnerPaymentExtraId: string | undefined;
          serializedTx: string | undefined;
      }
    // Sell trade.
    | {
          destinationAddress: string;
          cryptoStringAmount: string;
          destinationPaymentExtraId: string | undefined;
          shouldSendInSats: boolean | undefined;
          decimals: number;
      };

type GetRecomposeAmountParams = {
    value: string;
    shouldSendInSats: boolean | undefined;
    decimals: number;
};

const getRecomposeAmount = ({ value, shouldSendInSats, decimals }: GetRecomposeAmountParams) =>
    shouldSendInSats
        ? unitsToSubunits({ value: asAmountUnit(new BigNumber(value)), decimals }).toString()
        : value;

export const buildRecomposeInputsFromTrade = (trade: TradeRecomposeInput): RecomposeInputs => {
    if ('sendAddress' in trade) {
        return {
            address: trade.sendAddress,
            amount: getRecomposeAmount({
                value: trade.sendStringAmount,
                shouldSendInSats: trade.shouldSendInSats,
                decimals: trade.decimals,
            }),
            destinationTag: trade.partnerPaymentExtraId,
        };
    }

    if ('dexTx' in trade) {
        // after discussion with 1inch, adjust the gas limit by the factor of 1.25:
        // swap can use different swap paths when mining tx than when estimating tx,
        // and the geth gas estimate may be too low.
        return {
            address: trade.dexTx.to,
            amount: trade.dexTx.value,
            destinationTag: trade.partnerPaymentExtraId,
            transactionData: trade.serializedTx,
            ethereumAdjustGasLimit: ETHEREUM_ADJUST_GAS_LIMIT,
            recalculateCustomLimit: true,
        };
    }

    if ('destinationAddress' in trade) {
        return {
            address: trade.destinationAddress,
            amount: getRecomposeAmount({
                value: trade.cryptoStringAmount,
                shouldSendInSats: trade.shouldSendInSats,
                decimals: trade.decimals,
            }),
            destinationTag: trade.destinationPaymentExtraId,
        };
    }

    return exhaustive(trade);
};
