import { Linking } from 'react-native';

import { mockStakingState } from '@suite-common/earn-staking/mocks';
import { stakingAmountSchema, stakingProviderIdSchema } from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider, userEvent, waitFor } from '@suite-native/test-utils-store';
import { type StaticSessionId } from '@trezor/device-utils';

import { CardanoStakingInfoBanner } from './CardanoStakingInfoBanner';

const ada = asNetworkSymbol('ada');
const zero = stakingAmountSchema.parse('0');

const fivebinaries = mockStakingProductDescriptor({
    networkSymbol: ada,
    providerId: stakingProviderIdSchema.parse('fivebinaries'),
    type: 'native',
    operations: ['unstake', 'claim', 'vote'],
    consentKey: null,
    platforms: { desktop: { access: 'manage' }, mobile: { access: 'read-only' } },
});
const everstake = mockStakingProductDescriptor({
    networkSymbol: ada,
    type: 'native',
    operations: ['stake', 'unstake', 'claim', 'vote'],
    platforms: { desktop: { access: 'manage' }, mobile: { access: 'read-only' } },
});

const otherDeviceState: StaticSessionId = 'otherWallet@deviceId:1';
const account = mockWalletAccount({ symbol: ada });
const otherAccount = mockWalletAccount({ symbol: ada, deviceState: otherDeviceState });

const cardanoPosition = (productId: typeof fivebinaries.id, hasOutdatedProvider: boolean) =>
    mockStakingPosition({
        productId,
        lockup: 'liquid',
        balances: {
            staked: stakingAmountSchema.parse('5000000'),
            pending: zero,
            unstaking: zero,
            withdrawable: zero,
            rewards: zero,
        },
        unlocks: [],
        targets: [],
        operations: ['unstake', 'claim', 'vote'],
        warnings: hasOutdatedProvider
            ? [{ code: 'outdated-provider', providerId: fivebinaries.providerId }]
            : [],
    });

const preloadedState = {
    wallet: { accounts: [account, otherAccount] },
    earn: {
        staking: mockStakingState({
            platform: 'mobile',
            descriptors: [everstake, fivebinaries],
            positions: {
                [account.key]: [cardanoPosition(fivebinaries.id, true)],
                [otherAccount.key]: [cardanoPosition(everstake.id, false)],
            },
        }),
    },
};

describe('CardanoStakingInfoBanner', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('opens the provider migration article externally when Learn more is pressed', async () => {
        jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
        const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
        const { getByText } = await renderWithStoreProvider(
            <CardanoStakingInfoBanner accountKey={account.key} />,
            { preloadedState },
        );

        await userEvent.press(
            getByText(
                getTranslation('earn.stakingManagementScreen.cardanoNotEarningBanner.button'),
            ),
        );

        await waitFor(() => expect(openURL).toHaveBeenCalledTimes(1));
        const url = new URL(openURL.mock.calls[0]?.[0] ?? '');
        expect(url.origin + url.pathname).toBe(
            'https://trezor.io/support/troubleshooting/coins-tokens/fix-cardano-staking-that-s-no-longer-earning-rewards',
        );
        expect(url.hash).toBe('');
    });

    it('keeps the informational banner without Learn more for an account without the warning', async () => {
        const { queryByText, getByTestId } = await renderWithStoreProvider(
            <CardanoStakingInfoBanner accountKey={otherAccount.key} />,
            { preloadedState },
        );

        expect(getByTestId('@staking/cardano-desktop-only-banner')).toBeTruthy();
        expect(
            queryByText(
                getTranslation('earn.stakingManagementScreen.cardanoNotEarningBanner.button'),
            ),
        ).toBeNull();
    });
});
