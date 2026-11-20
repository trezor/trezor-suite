import { mockStakingState } from '@suite-common/earn-staking/mocks';
import {
    type StakingAmount,
    stakingAmountSchema,
    stakingProviderIdSchema,
} from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import { type StaticSessionId } from '@trezor/device-utils';

import { FiveBinariesHomeBanner } from './FiveBinariesHomeBanner';

const deviceState: StaticSessionId = 'selectedWallet@deviceId:0';
const selectedDevice = mockSuiteDevice({ state: { staticSessionId: deviceState } });
const ada = asNetworkSymbol('ada');

const fivebinaries = mockStakingProductDescriptor({
    networkSymbol: ada,
    providerId: stakingProviderIdSchema.parse('fivebinaries'),
    type: 'native',
    operations: ['unstake', 'claim', 'vote'],
    consentKey: null,
    platforms: { desktop: { access: 'manage' }, mobile: { access: 'read-only' } },
});
const account = mockWalletAccount({ symbol: ada, deviceState });
const zero = stakingAmountSchema.parse('0');

const createPreloadedState = (staked: StakingAmount) => ({
    device: { devices: [selectedDevice], selectedDevice },
    wallet: { accounts: [account] },
    networks: mockNetworksState([ada]),
    earn: {
        staking: mockStakingState({
            platform: 'mobile',
            descriptors: [fivebinaries],
            positions: {
                [account.key]: [
                    mockStakingPosition({
                        productId: fivebinaries.id,
                        lockup: 'liquid',
                        balances: {
                            staked,
                            pending: zero,
                            unstaking: zero,
                            withdrawable: zero,
                            rewards: zero,
                        },
                        unlocks: [],
                        targets: [],
                        operations: ['unstake', 'claim', 'vote'],
                        warnings: [
                            { code: 'outdated-provider', providerId: fivebinaries.providerId },
                        ],
                    }),
                ],
            },
        }),
    },
});

describe('FiveBinariesHomeBanner', () => {
    it('does not render for an empty Five Binaries account', async () => {
        const { toJSON } = await renderWithStoreProvider(<FiveBinariesHomeBanner />, {
            preloadedState: createPreloadedState(zero),
        });

        expect(toJSON()).toBeNull();
    });

    it('renders for a funded Five Binaries account', async () => {
        const { getByText } = await renderWithStoreProvider(<FiveBinariesHomeBanner />, {
            preloadedState: createPreloadedState(stakingAmountSchema.parse('1000000')),
        });

        expect(
            getByText(getTranslation('earn.stakingManagementScreen.cardanoNotEarningBanner.title')),
        ).toBeTruthy();
    });
});
