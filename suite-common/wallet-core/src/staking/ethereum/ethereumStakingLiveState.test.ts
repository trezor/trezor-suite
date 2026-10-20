import { asNetworkSymbol } from '@suite-common/wallet-config';
import TrezorConnect from '@trezor/connect';

import { readEthereumStakingPools } from './ethereumStakingLiveState';

const ethSymbol = asNetworkSymbol('eth');

describe(readEthereumStakingPools.name, () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('reads the staking pools of the account', async () => {
        const getAccountInfo = jest.spyOn(TrezorConnect, 'getAccountInfo').mockResolvedValue({
            success: true,
            payload: {
                misc: { stakingPools: [{ autocompoundBalance: '2000000000000000000' }] },
            },
        } as unknown as Awaited<ReturnType<typeof TrezorConnect.getAccountInfo>>);

        await expect(
            readEthereumStakingPools({ symbol: ethSymbol, descriptor: '0xabc', identity: '0' }),
        ).resolves.toEqual({
            success: true,
            stakingPools: [{ autocompoundBalance: '2000000000000000000' }],
        });
        expect(getAccountInfo).toHaveBeenCalledWith({
            coin: 'eth',
            identity: '0',
            details: 'tokenBalances',
            descriptor: '0xabc',
        });
    });

    it('reports a failed account info read', async () => {
        jest.spyOn(TrezorConnect, 'getAccountInfo').mockResolvedValue({
            success: false,
            error: { message: 'Account info error' },
        } as unknown as Awaited<ReturnType<typeof TrezorConnect.getAccountInfo>>);

        await expect(
            readEthereumStakingPools({ symbol: ethSymbol, descriptor: '0xabc' }),
        ).resolves.toEqual({ success: false, message: 'Account info error' });
    });
});
