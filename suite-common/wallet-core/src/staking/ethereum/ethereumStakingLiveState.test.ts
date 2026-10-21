import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import TrezorConnect from '@trezor/connect';

import { createEthereumStakingPositionReader } from './ethereumStakingLiveState';
import { type StakingPosition } from '../positions/positionsTypes';

type GetAccountInfoResult = Awaited<ReturnType<typeof TrezorConnect.getAccountInfo>>;

const ethAccount = {
    ...mockWalletAccount({
        symbol: asNetworkSymbol('eth'),
        descriptor: asAccountDescriptor('0xabc'),
    }),
    networkType: 'ethereum',
    misc: { nonce: '3' },
} as Account;

const position = { providerId: 'everstake', staked: '1' } as StakingPosition;

describe(createEthereumStakingPositionReader.name, () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('derives the position from the freshly read account', async () => {
        const stakingPools = [{ contract: '0x1', autocompoundBalance: '2000000000000000000' }];
        const getAccountInfo = jest.spyOn(TrezorConnect, 'getAccountInfo').mockResolvedValue({
            success: true,
            payload: { misc: { stakingPools } },
        } as unknown as GetAccountInfoResult);
        const derivePosition = jest.fn(() => position);

        const read = createEthereumStakingPositionReader({
            account: ethAccount,
            adapter: { derivePosition },
            identity: '0',
        });

        await expect(read()).resolves.toEqual({ success: true, position });
        expect(getAccountInfo).toHaveBeenCalledWith({
            coin: 'eth',
            identity: '0',
            details: 'tokenBalances',
            descriptor: '0xabc',
        });
        expect(derivePosition).toHaveBeenCalledWith(
            expect.objectContaining({
                descriptor: '0xabc',
                misc: { nonce: '3', stakingPools },
            }),
        );
    });

    it('reports a failed account info read', async () => {
        jest.spyOn(TrezorConnect, 'getAccountInfo').mockResolvedValue({
            success: false,
            error: { message: 'Account info error' },
        } as unknown as GetAccountInfoResult);
        const derivePosition = jest.fn(() => position);

        const read = createEthereumStakingPositionReader({
            account: ethAccount,
            adapter: { derivePosition },
        });

        await expect(read()).resolves.toEqual({ success: false, message: 'Account info error' });
        expect(derivePosition).not.toHaveBeenCalled();
    });

    it('does not read a non-Ethereum account', async () => {
        const getAccountInfo = jest.spyOn(TrezorConnect, 'getAccountInfo');

        const read = createEthereumStakingPositionReader({
            account: mockWalletAccount({ symbol: asNetworkSymbol('btc') }),
            adapter: { derivePosition: () => position },
        });

        await expect(read()).resolves.toEqual({
            success: false,
            message: 'Account is not an Ethereum account.',
        });
        expect(getAccountInfo).not.toHaveBeenCalled();
    });
});
