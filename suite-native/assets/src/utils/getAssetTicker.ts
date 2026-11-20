import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TickerId } from '@suite-common/wallet-types';

type GetAssetTickerParams = {
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
    isErc4626Token: boolean;
};

export const getAssetTicker = ({
    networkSymbol,
    tokenContract,
    isErc4626Token,
}: GetAssetTickerParams): TickerId => ({
    symbol: networkSymbol,
    tokenAddress: tokenContract,
    protocols: isErc4626Token ? ['erc4626'] : undefined,
});
