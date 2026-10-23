import { Linking } from 'react-native';

import { FIVE_BINARIES_POOLS, asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount, networkSpecificDefaultCardano } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider, userEvent, waitFor } from '@suite-native/test-utils-store';

import { CardanoStakingInfoBanner } from './CardanoStakingInfoBanner';

const account: Account = {
    ...mockWalletAccount({ symbol: asNetworkSymbol('ada') }),
    ...networkSpecificDefaultCardano,
    misc: {
        staking: {
            ...networkSpecificDefaultCardano.misc.staking,
            poolId: FIVE_BINARIES_POOLS[0] ?? null,
        },
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
            { preloadedState: { wallet: { accounts: [account] } } },
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

    it('keeps the informational banner without Learn more for an account outside FiveBinaries', async () => {
        const otherAccount = mockWalletAccount({ symbol: asNetworkSymbol('ada') });
        const { queryByText, getByTestId } = await renderWithStoreProvider(
            <CardanoStakingInfoBanner accountKey={otherAccount.key} />,
            { preloadedState: { wallet: { accounts: [otherAccount] } } },
        );

        expect(getByTestId('@staking/cardano-desktop-only-banner')).toBeTruthy();
        expect(
            queryByText(
                getTranslation('earn.stakingManagementScreen.cardanoNotEarningBanner.button'),
            ),
        ).toBeNull();
    });
});
