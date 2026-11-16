import { deviceInitialState } from '@suite-common/device';
import { type StakingAccessRootState } from '@suite-common/earn-staking';
import { mockStakingState } from '@suite-common/earn-staking/mocks';
import { mockStakingProductDescriptor } from '@suite-common/earn-staking-common/mocks';
import { messageSystemInitialState } from '@suite-common/message-system';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import { selectIsStakingManageableSymbol } from './stakingSelectors';

const eth = mockStakingProductDescriptor();
const ada = mockStakingProductDescriptor({
    networkSymbol: asNetworkSymbol('ada'),
    type: 'native',
    operations: ['stake', 'unstake', 'claim', 'vote'],
    platforms: { desktop: { access: 'manage' }, mobile: { access: 'read-only' } },
});

const state: StakingAccessRootState = {
    earn: { staking: mockStakingState({ platform: 'mobile', descriptors: [eth, ada] }) },
    messageSystem: messageSystemInitialState,
    device: deviceInitialState,
};

describe('selectIsStakingManageableSymbol', () => {
    it.each([
        { symbol: 'eth', expected: true },
        { symbol: 'ada', expected: false },
        { symbol: 'btc', expected: false },
    ])('is $expected for $symbol on mobile', ({ symbol, expected }) => {
        expect(selectIsStakingManageableSymbol(state, asNetworkSymbol(symbol))).toBe(expected);
    });
});
