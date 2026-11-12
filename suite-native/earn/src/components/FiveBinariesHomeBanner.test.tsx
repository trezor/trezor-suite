import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { FIVE_BINARIES_POOLS, asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import { type StaticSessionId } from '@trezor/device-utils';

import { FiveBinariesHomeBanner } from './FiveBinariesHomeBanner';

const deviceState: StaticSessionId = 'selectedWallet@deviceId:0';
const selectedDevice = mockSuiteDevice({ state: { staticSessionId: deviceState } });

const createPreloadedState = (balance: string) => {
    const account = mockWalletAccount({ symbol: asNetworkSymbol('ada'), deviceState, balance });

    if (account.networkType !== 'cardano') throw new Error('Expected a Cardano account');

    return {
        device: { devices: [selectedDevice], selectedDevice },
        wallet: {
            accounts: [
                {
                    ...account,
                    misc: {
                        ...account.misc,
                        staking: {
                            ...account.misc.staking,
                            poolId: FIVE_BINARIES_POOLS[0] ?? null,
                        },
                    },
                },
            ],
        },
    };
};

describe('FiveBinariesHomeBanner', () => {
    it('does not render for an empty Five Binaries account', async () => {
        const { toJSON } = await renderWithStoreProvider(<FiveBinariesHomeBanner />, {
            preloadedState: createPreloadedState('0'),
        });

        expect(toJSON()).toBeNull();
    });

    it('renders for a funded Five Binaries account', async () => {
        const { getByText } = await renderWithStoreProvider(<FiveBinariesHomeBanner />, {
            preloadedState: createPreloadedState('1'),
        });

        expect(
            getByText(getTranslation('earn.stakingManagementScreen.cardanoNotEarningBanner.title')),
        ).toBeTruthy();
    });
});
