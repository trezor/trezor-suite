import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    SupportedCardanoNetworkSymbols,
    supportedCardanoNetworkSymbols,
} from '@suite-common/wallet-types';
import { isArrayMember } from '@trezor/utils';

export function isSupportedCardanoStakingNetworkSymbol(
    symbol: NetworkSymbol,
): symbol is SupportedCardanoNetworkSymbols {
    return isArrayMember(symbol, supportedCardanoNetworkSymbols);
}
