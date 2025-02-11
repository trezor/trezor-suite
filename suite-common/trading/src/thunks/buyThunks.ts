import { BuyProviderInfo, CryptoId, FiatCurrencyCode } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';

import { invityAPI } from '../invityAPI';
import { BuyInfo } from '../reducers/buyReducer';
import { regional } from '../regional';
import { TradingFiatCurrenciesProps } from '../types';

const BUY_COMMON_PREFIX = '@trading-buy/thunk';

const loadInfoThunk = createThunk<BuyInfo>(`${BUY_COMMON_PREFIX}/loadInfo`, async () => {
    const buyInfo = await invityAPI.getBuyList();
    const defaultAmountsOfFiatCurrencies: TradingFiatCurrenciesProps = new Map();

    if (!buyInfo?.providers) {
        return {
            buyInfo: {
                country: regional.UNKNOWN_COUNTRY,
                providers: [],
                defaultAmountsOfFiatCurrencies,
            },
            providerInfos: {},
            supportedFiatCurrencies: new Set(),
            supportedCryptoCurrencies: new Set(),
        };
    }

    const providerInfos: { [name: string]: BuyProviderInfo } = {};

    buyInfo.providers.forEach(e => (providerInfos[e.name] = e));

    const tradedFiatCurrencies: string[] = [];
    const tradedCoins: CryptoId[] = [];
    buyInfo.providers.forEach(p => {
        tradedFiatCurrencies.push(...p.tradedFiatCurrencies.map(c => c.toLowerCase()));
        tradedCoins.push(...p.tradedCoins);
    });
    const supportedFiatCurrencies = new Set(tradedFiatCurrencies);
    const supportedCryptoCurrencies = new Set(tradedCoins);

    if (buyInfo.defaultAmountsOfFiatCurrencies) {
        Object.entries(buyInfo.defaultAmountsOfFiatCurrencies).forEach(([key, value]) => {
            defaultAmountsOfFiatCurrencies.set(key as FiatCurrencyCode, value.toString());
        });
    }

    return {
        buyInfo: {
            ...buyInfo,
            defaultAmountsOfFiatCurrencies,
        },
        providerInfos,
        supportedFiatCurrencies,
        supportedCryptoCurrencies,
    };
});

export const buyThunks = {
    loadInfoThunk,
};
