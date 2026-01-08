import type { CoinInfo, SellFiatTrade } from 'invity-api';

import { invariant } from '@suite-common/suite-utils';
import { MinimalSellFormProps, cryptoIdToNetwork } from '@suite-common/trading';
import { coinInfoToTradeableAsset } from '@suite-native/trading-atoms';
import { SellFormType } from '@suite-native/trading-types';

export const tradingSellFormToTradingSellFormProps = (
    getValues: SellFormType['getValues'],
): MinimalSellFormProps => {
    const [amountInCrypto, fiatStringAmount, cryptoStringAmount, fiatCurrency, sendAsset, country] =
        getValues([
            'amountInCrypto',
            'fiatStringAmount',
            'cryptoStringAmount',
            'fiatCurrency',
            'sendAsset',
            'country',
        ]);

    invariant(sendAsset, 'sendAsset is required');
    invariant(!amountInCrypto || cryptoStringAmount, 'cryptoStringAmount is required');
    invariant(amountInCrypto || fiatStringAmount, 'fiatStringAmount is required');

    const outputs = [
        {
            amount: amountInCrypto ? cryptoStringAmount : undefined,
            fiat: amountInCrypto ? undefined : fiatStringAmount,
            currency: { value: fiatCurrency },
        },
    ];

    return {
        outputs,
        amountInCrypto,
        countrySelect: country,
        sendCryptoSelect: { id: sendAsset.cryptoId },
    };
};

export type GetAnalyticsTradingSellPayloadProps = {
    quote: SellFiatTrade | undefined;
    coinInfo: CoinInfo | undefined;
};

export const getAnalyticsTradingSellPayload = ({
    quote,
    coinInfo,
}: GetAnalyticsTradingSellPayloadProps) => {
    if (!coinInfo || !quote?.cryptoCurrency) {
        return null;
    }

    const tradeableAsset = coinInfoToTradeableAsset(quote.cryptoCurrency, coinInfo);
    const symbol = cryptoIdToNetwork(quote.cryptoCurrency)?.symbol;

    if (!tradeableAsset) {
        return null;
    }

    return {
        cryptoLabel: tradeableAsset.symbol,
        cryptoNetworkSymbol: symbol,
        cryptoContractAddress: tradeableAsset.contractAddress,
        receiveMethod: quote.paymentMethod,
        countryOfResidence: quote.country,
        exchangeName: quote.exchange,
    };
};
