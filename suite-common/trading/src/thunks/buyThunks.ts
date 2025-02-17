import { BuyProviderInfo, CryptoId, FiatCurrencyCode } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';

import { invityAPI } from '../invityAPI';
import { BuyInfo } from '../reducers/buyReducer';
import { regional } from '../regional';

const BUY_COMMON_PREFIX = '@trading-buy/thunk';

const loadInfoThunk = createThunk<BuyInfo>(
    `${BUY_COMMON_PREFIX}/loadInfo`,
    async (_, { fulfillWithValue }) => {
        const buyInfo = await invityAPI.getBuyList();

        if (!buyInfo?.providers) {
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

        buyInfo.providers.forEach(e => (providerInfos[e.name] = e));

        const supportedFiatCurrencies: string[] = [];
        const supportedCryptoCurrencies: CryptoId[] = [];
        buyInfo.providers.forEach(provider => {
            supportedFiatCurrencies.push(
                ...provider.tradedFiatCurrencies.map(c => c.toLowerCase()),
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

export const buyThunks = {
    loadInfoThunk,
};
