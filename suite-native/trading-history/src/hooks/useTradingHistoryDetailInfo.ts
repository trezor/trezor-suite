import { useSelector } from 'react-redux';

import type { CryptoId, FiatCurrencyCode } from 'invity-api';

import { selectIsMevProtectionFeatureEnabled } from '@suite-common/mev';
import {
    type TradingRootState,
    cryptoIdToNetwork,
    selectTradingProviderByNameAndTradeType,
    selectTradingTradeByOrderId,
} from '@suite-common/trading';
import {
    type AccountsRootState,
    selectAccountByKey,
    selectIsMevProtectionEnabled,
} from '@suite-common/wallet-core';
import { useFormatCryptoValue } from '@suite-native/trading-atoms';
import { getTradeOperationData } from '@suite-native/trading-quote-utils';
import { BigNumber } from '@trezor/utils';

export type TradingHistoryDetailAsset =
    | {
          type: 'crypto';
          accountLabel?: string;
          amount: string;
          cryptoId: CryptoId;
      }
    | {
          type: 'fiat';
          amount: string;
          fiatCurrency: FiatCurrencyCode;
      };

export type TradingHistoryDetailPaymentMethod = {
    label: 'payment' | 'payout';
    paymentMethod: string;
    paymentMethodName?: string;
};

export type TradingHistoryDetailRateType = 'fixed' | 'floating';

export type TradingHistoryDetailProvider = {
    logo?: string;
    name: string;
};

export const useTradingHistoryDetailInfo = (orderId: string) => {
    const trade = useSelector((state: TradingRootState) =>
        selectTradingTradeByOrderId(state, orderId),
    );
    const sendAccount = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, trade?.tradeType === 'buy' ? undefined : trade?.sendAccountKey),
    );
    const receiveAccount = useSelector((state: AccountsRootState) =>
        selectAccountByKey(
            state,
            trade?.tradeType === 'sell' ? undefined : trade?.receiveAccountKey,
        ),
    );
    const provider = useSelector((state: TradingRootState) =>
        trade
            ? selectTradingProviderByNameAndTradeType(state, trade.data.exchange, trade.tradeType)
            : undefined,
    );
    const isMevProtectionEnabled = useSelector(selectIsMevProtectionEnabled);
    const isMevProtectionFeatureEnabled = useSelector(selectIsMevProtectionFeatureEnabled);

    const formatCryptoValue = useFormatCryptoValue();

    if (!trade) {
        return null;
    }

    const operation = getTradeOperationData(trade.data);
    const isDex = trade.tradeType === 'exchange' && !!trade.data.isDex;
    const swapSlippage = isDex && trade.data.swapSlippage ? trade.data.swapSlippage : undefined;
    const minimumReceived =
        swapSlippage !== undefined && operation.toValue !== undefined && operation.isToCrypto
            ? new BigNumber(operation.toValue)
                  .multipliedBy(new BigNumber(100).minus(swapSlippage))
                  .dividedBy(100)
                  .toString()
            : undefined;
    const formattedMinimumReceived =
        operation.isToCrypto && minimumReceived
            ? formatCryptoValue(minimumReceived, operation.toCurrency)
            : undefined;
    const sendNetwork =
        trade.tradeType === 'exchange' ? cryptoIdToNetwork(trade.data.send) : undefined;
    const shouldShowMevProtection =
        isDex &&
        isMevProtectionFeatureEnabled &&
        !!sendNetwork?.features.includes('mev-protection');
    const providerName = provider?.companyName ?? trade.data.exchange?.toUpperCase();
    const isFixedRate = provider && 'isFixedRate' in provider ? provider.isFixedRate : false;

    let payAsset: TradingHistoryDetailAsset | undefined;

    if (operation.fromValue && operation.fromCurrency) {
        if (operation.isFromCrypto) {
            payAsset = {
                type: 'crypto',
                accountLabel: sendAccount?.accountLabel,
                amount: operation.fromValue,
                cryptoId: operation.fromCurrency,
            };
        } else if (operation.isFromCrypto === false) {
            payAsset = {
                type: 'fiat',
                amount: operation.fromValue,
                fiatCurrency: operation.fromCurrency as FiatCurrencyCode,
            };
        }
    }

    let getAsset: TradingHistoryDetailAsset | undefined;

    if (operation.toValue && operation.toCurrency) {
        if (operation.isToCrypto) {
            getAsset = {
                type: 'crypto',
                accountLabel: receiveAccount?.accountLabel,
                amount: operation.toValue,
                cryptoId: operation.toCurrency,
            };
        } else if (operation.isToCrypto === false) {
            getAsset = {
                type: 'fiat',
                amount: operation.toValue,
                fiatCurrency: operation.toCurrency as FiatCurrencyCode,
            };
        }
    }

    const paymentMethod: TradingHistoryDetailPaymentMethod | undefined =
        trade.tradeType !== 'exchange' && trade.data.paymentMethod
            ? {
                  label: trade.tradeType === 'buy' ? 'payment' : 'payout',
                  paymentMethod: trade.data.paymentMethod,
                  paymentMethodName: trade.data.paymentMethodName,
              }
            : undefined;
    let rateType: TradingHistoryDetailRateType | undefined;

    if (trade.tradeType === 'exchange' && !isDex && provider) {
        rateType = isFixedRate ? 'fixed' : 'floating';
    }
    const tradingProvider: TradingHistoryDetailProvider | undefined = providerName
        ? { logo: provider?.logo, name: providerName }
        : undefined;

    return {
        formattedMinimumReceived,
        getAsset,
        isMevProtectionEnabled: shouldShowMevProtection ? isMevProtectionEnabled : undefined,
        payAsset,
        paymentMethod,
        placedAt: new Date(trade.date),
        provider: tradingProvider,
        rateType,
        swapSlippage,
    };
};
