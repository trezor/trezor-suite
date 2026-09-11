import { type NetworkSymbol } from '@suite-common/wallet-config';
import { getNetworkReserve } from '@suite-common/wallet-utils';
import { BigNumber, type BigNumberValue } from '@trezor/utils';

import { CONTRACT_ADDRESS_FOR_NATIVE_TOKEN } from '../constants';

const TRADING_DEX_RESERVES: Partial<Record<NetworkSymbol, string>> = {
    btc: '0.00002',
};

type GetTradingDexReserveParams = {
    symbol?: NetworkSymbol;
    contractAddress?: string | null;
    isDex: boolean;
    isNetworkReserveEnabled: boolean;
};

type GetMaxAmountWithReserveParams = {
    maxAmount: BigNumberValue;
    reserve: BigNumberValue | undefined;
};

export const getMaxAmountWithReserve = ({
    maxAmount,
    reserve,
}: GetMaxAmountWithReserveParams): BigNumber =>
    BigNumber.max(0, new BigNumber(maxAmount).minus(reserve ?? '0'));

export const getTradingDexReserve = ({
    symbol,
    contractAddress,
    isDex,
    isNetworkReserveEnabled,
}: GetTradingDexReserveParams): string | undefined => {
    const isToken = !!contractAddress && contractAddress !== CONTRACT_ADDRESS_FOR_NATIVE_TOKEN;

    if (!symbol || !isDex || !isNetworkReserveEnabled || isToken) {
        return undefined;
    }

    return TRADING_DEX_RESERVES[symbol];
};

export const getTradingNetworkReserve = (
    params: GetTradingDexReserveParams,
): string | undefined => {
    const dexReserve = getTradingDexReserve(params);

    if (dexReserve !== undefined || !params.symbol) {
        return dexReserve;
    }

    return getNetworkReserve({
        symbol: params.symbol,
        contractAddress: params.contractAddress,
        isEnabled: params.isNetworkReserveEnabled,
    });
};
