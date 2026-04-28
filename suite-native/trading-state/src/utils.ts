import {
    type TradingCountrySubdivisionOption,
    type TradingExchangeType,
    type TradingSellType,
    getCountrySubdivisionByCode,
    isCountryCode,
    isCountrySubdivisionRequired,
} from '@suite-common/trading';
import { getNetworkByCoingeckoId } from '@suite-common/wallet-config';
import { getFormDraftKey } from '@suite-common/wallet-utils';
import { type TradeableAsset } from '@suite-native/trading-types';
import { exhaustive } from '@trezor/type-utils';

export const getFormDraftKeyByTradeType = (tradeType: TradingSellType | TradingExchangeType) => {
    switch (tradeType) {
        case 'exchange':
            return getFormDraftKey('trading-exchange', '');
        case 'sell':
            return getFormDraftKey('trading-sell', '');
        default:
            return exhaustive(tradeType);
    }
};

export const getDefaultCountrySubdivision = (
    countryCode: string,
    countrySubdivisionCode: string | undefined,
): TradingCountrySubdivisionOption | undefined => {
    if (
        !countrySubdivisionCode ||
        !isCountryCode(countryCode) ||
        !isCountrySubdivisionRequired(countryCode)
    ) {
        return undefined;
    }

    const subdivision = getCountrySubdivisionByCode(countrySubdivisionCode, countryCode);

    if (!subdivision) {
        return undefined;
    }

    return {
        value: subdivision.code,
        label: subdivision.name,
        name: subdivision.name,
    };
};

export const getAssetByEnabledNetworksFilter =
    (areDebugOnlyNetworksEnabled: boolean, areExperimentalOnlyNetworksEnabled: boolean) =>
    ({ networkId }: TradeableAsset) => {
        const network = getNetworkByCoingeckoId(networkId);

        if (!network) {
            return false;
        }

        if (network.isDebugOnlyNetwork) {
            return areDebugOnlyNetworksEnabled;
        }

        if (network.isExperimentalOnlyNetwork) {
            return areExperimentalOnlyNetworksEnabled;
        }

        return true;
    };
