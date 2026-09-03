import { useSelector } from 'react-redux';

import type { CryptoId, FiatCurrencyCode } from 'invity-api';

import { selectIsMevProtectionFeatureEnabled } from '@suite-common/mev';
import {
    type TradingAssetOption,
    type TradingRootState,
    cryptoIdToNetwork,
    selectTradingProviderByNameAndTradeType,
    selectTradingTradeByOrderId,
    useTradingAssets,
} from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountsRootState, selectIsMevProtectionEnabled } from '@suite-common/wallet-core';
import { type TokenSymbol } from '@suite-common/wallet-types';
import { type CombinedLabelingState } from '@suite-native/labeling';
import { useFormatCryptoValue } from '@suite-native/trading-atoms';
import { getTradeOperationData } from '@suite-native/trading-quote-utils';
import { selectAccountLabelWithNetworkFallback } from '@suite-native/trading-state';
import { BigNumber } from '@trezor/utils';

export type TradingHistoryDetailCryptoAsset = {
    type: 'crypto';
    accountLabel?: string;
    amount: string;
    contractAddress?: string;
    cryptoId: CryptoId;
    displaySymbol: string;
    name: string;
    networkSymbol: NetworkSymbol;
    symbol: NetworkSymbol | TokenSymbol;
};

export type TradingHistoryDetailAsset =
    | TradingHistoryDetailCryptoAsset
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

type GetTradingHistoryDetailRateTypeParams = {
    hasProvider: boolean;
    isDex: boolean;
    isExchange: boolean;
    isFixedRate: boolean;
};

const getTradingHistoryDetailRateType = ({
    hasProvider,
    isDex,
    isExchange,
    isFixedRate,
}: GetTradingHistoryDetailRateTypeParams): TradingHistoryDetailRateType | undefined => {
    if (!isExchange || isDex || !hasProvider) {
        return undefined;
    }

    return isFixedRate ? 'fixed' : 'floating';
};

type GetTradingHistoryDetailAssetParams = {
    accountLabel?: string;
    amount?: string;
    createAssetOptionFromCryptoId: (cryptoId?: CryptoId) => TradingAssetOption;
    currency?: string;
    isCrypto?: boolean;
};

const getTradingHistoryDetailAsset = ({
    accountLabel,
    amount,
    createAssetOptionFromCryptoId,
    currency,
    isCrypto,
}: GetTradingHistoryDetailAssetParams): TradingHistoryDetailAsset | undefined => {
    if (!amount || !currency || isCrypto === undefined) {
        return undefined;
    }

    if (!isCrypto) {
        return {
            type: 'fiat',
            amount,
            fiatCurrency: currency as FiatCurrencyCode,
        };
    }

    const cryptoId = currency as CryptoId;
    const cryptoAsset = createAssetOptionFromCryptoId(cryptoId);

    return {
        type: 'crypto',
        accountLabel: accountLabel ?? cryptoAsset.networkName,
        amount,
        contractAddress: cryptoAsset.contractAddress ?? undefined,
        cryptoId,
        displaySymbol: cryptoAsset.displaySymbol,
        name: cryptoAsset.name,
        networkSymbol: cryptoAsset.networkSymbol,
        symbol: cryptoAsset.symbol as NetworkSymbol | TokenSymbol,
    };
};

export const useTradingHistoryDetailInfo = (orderId: string) => {
    const trade = useSelector((state: TradingRootState) =>
        selectTradingTradeByOrderId(state, orderId),
    );
    const operation = getTradeOperationData(trade?.data);
    const payCryptoId = operation.isFromCrypto ? operation.fromCurrency : undefined;
    const getCryptoId = operation.isToCrypto ? operation.toCurrency : undefined;

    const payAccountLabel = useSelector((state: AccountsRootState & CombinedLabelingState) =>
        selectAccountLabelWithNetworkFallback(
            state,
            trade?.tradeType === 'buy' ? undefined : trade?.sendAccountKey,
            payCryptoId,
        ),
    );

    const getAccountLabel = useSelector((state: AccountsRootState & CombinedLabelingState) =>
        selectAccountLabelWithNetworkFallback(
            state,
            trade?.tradeType === 'sell' ? undefined : trade?.receiveAccountKey,
            getCryptoId,
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
    const { createAssetOptionFromCryptoId } = useTradingAssets();

    if (!trade) {
        return null;
    }

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

    const payAsset = getTradingHistoryDetailAsset({
        accountLabel: payAccountLabel,
        amount: operation.fromValue,
        createAssetOptionFromCryptoId,
        currency: operation.fromCurrency,
        isCrypto: operation.isFromCrypto,
    });
    const getAsset = getTradingHistoryDetailAsset({
        accountLabel: getAccountLabel,
        amount: operation.toValue,
        createAssetOptionFromCryptoId,
        currency: operation.toCurrency,
        isCrypto: operation.isToCrypto,
    });

    const paymentMethod: TradingHistoryDetailPaymentMethod | undefined =
        trade.tradeType !== 'exchange' && trade.data.paymentMethod
            ? {
                  label: trade.tradeType === 'buy' ? 'payment' : 'payout',
                  paymentMethod: trade.data.paymentMethod,
                  paymentMethodName: trade.data.paymentMethodName,
              }
            : undefined;
    const rateType = getTradingHistoryDetailRateType({
        hasProvider: !!provider,
        isDex,
        isExchange: trade.tradeType === 'exchange',
        isFixedRate,
    });
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
