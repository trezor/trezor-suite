import { ExchangeCoinInfo } from '@suite/services/invityAPI/exchangeTypes';
import { BuyListResponse, BuyProviderInfo } from '@suite/services/invityAPI/buyTypes';
import invityAPI from '@suite/services/invityAPI/service';

export interface BuyInfo {
    coins: ExchangeCoinInfo[];
    buyInfo?: BuyListResponse;
    providerInfos: { [name: string]: BuyProviderInfo };
}
export async function loadBuyInfo(): Promise<{
    coins: ExchangeCoinInfo[];
    buyInfo?: BuyListResponse;
    providerInfos: { [name: string]: BuyProviderInfo };
}> {
    let [buyInfo, coins] = await Promise.all([
        invityAPI.getBuyList(),
        invityAPI.getExchangeCoins(),
    ]);
    if (!buyInfo) {
        buyInfo = { country: 'unknown', providers: [] };
    }
    if (!buyInfo.providers) {
        buyInfo.providers = [];
    }
    if (!coins) {
        coins = [];
    }
    const providerInfos: { [name: string]: BuyProviderInfo } = {};
    buyInfo.providers.forEach(e => (providerInfos[e.name] = e));
    return {
        coins,
        buyInfo,
        providerInfos,
    };
}
