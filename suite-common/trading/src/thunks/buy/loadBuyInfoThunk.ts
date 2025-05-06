import { BuyProviderInfo, CryptoId, FiatCurrencyCode } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';

import { TRADING_BUY_THUNK_PREFIX } from '../../constants';
import { invityAPI } from '../../invityAPI';
import { BuyInfo } from '../../reducers/buyReducer';
import { regional } from '../../regional';

export const loadBuyInfoThunk = createThunk<BuyInfo>(
    `${TRADING_BUY_THUNK_PREFIX}/loadInfo`,
    async (_, { fulfillWithValue }) => {
        const buyInfo = await invityAPI.getBuyList();

        if (!buyInfo || !buyInfo.providers) {
            return fulfillWithValue({
                buyInfo: {
                    country: regional.UNKNOWN_COUNTRY,
                    providers: [],
                    defaultAmountsOfFiatCurrencies: {} as Record<FiatCurrencyCode, number>,
                },
                providerInfos: {},
                supportedFiatCurrencies: [],
                supportedCryptoCurrencies: [],
            });
        }

        const providerInfos: { [name: string]: BuyProviderInfo } = {};

        buyInfo.providers.forEach(provider => (providerInfos[provider.name] = provider));

        const supportedFiatCurrencies: FiatCurrencyCode[] = [];
        const supportedCryptoCurrencies: CryptoId[] = [];
        buyInfo.providers.forEach(provider => {
            supportedFiatCurrencies.push(
                ...provider.tradedFiatCurrencies.map(
                    currency => currency.toLowerCase() as FiatCurrencyCode,
                ),
            );
            supportedCryptoCurrencies.push(...provider.tradedCoins);
        });

        return fulfillWithValue({
            buyInfo,
            providerInfos,
            supportedFiatCurrencies,
            supportedCryptoCurrencies,
        });
    },
);
