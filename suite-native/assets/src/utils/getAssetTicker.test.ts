import { toTokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import { getAssetTicker } from './getAssetTicker';

const ethSymbol = asNetworkSymbol('eth');
const vaultContract = toTokenAddress('0x83f20f44975d03b1b09e64809b757c47f942beea');

describe('getAssetTicker', () => {
    it('marks an ERC-4626 vault token with the erc4626 protocol', () => {
        expect(
            getAssetTicker({
                networkSymbol: ethSymbol,
                tokenContract: vaultContract,
                isErc4626Token: true,
            }),
        ).toEqual({ symbol: ethSymbol, tokenAddress: vaultContract, protocols: ['erc4626'] });
    });

    it('leaves the protocols of a regular asset empty', () => {
        expect(getAssetTicker({ networkSymbol: ethSymbol, isErc4626Token: false })).toEqual({
            symbol: ethSymbol,
            tokenAddress: undefined,
            protocols: undefined,
        });
    });
});
