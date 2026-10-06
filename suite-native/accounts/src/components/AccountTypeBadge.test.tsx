import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import type { StaticSessionId } from '@trezor/connect';

import { AccountTypeBadge } from './AccountTypeBadge';

const ethSymbol = asNetworkSymbol('eth');

const MOCK_ACCOUNT_DEVICE_SESSION_ID: StaticSessionId = '1@2:3';

describe('AccountTypeBadge', () => {
    const ethNormalAccount = mockWalletAccount({
        symbol: ethSymbol,
        deviceState: MOCK_ACCOUNT_DEVICE_SESSION_ID,
        accountType: 'normal',
        descriptor: asAccountDescriptor('eth1normal'),
        visible: true,
    });

    const ethLedgerAccount = mockWalletAccount({
        symbol: ethSymbol,
        deviceState: MOCK_ACCOUNT_DEVICE_SESSION_ID,
        accountType: 'ledger',
        descriptor: asAccountDescriptor('eth1ledger'),
        visible: true,
    });

    const accounts = [ethNormalAccount, ethLedgerAccount];

    const renderAccountTypeBadge = async (accountKey: AccountKey) =>
        await renderWithStoreProvider(<AccountTypeBadge accountKey={accountKey} />, {
            preloadedState: { wallet: { accounts } },
        });

    it('should render the formatted account type', async () => {
        const { getByText } = await renderAccountTypeBadge(ethLedgerAccount.key);

        expect(getByText('Ledger')).toBeOnTheScreen();
    });

    it('should render nothing for a normal non-bitcoin account', async () => {
        const { toJSON } = await renderAccountTypeBadge(ethNormalAccount.key);

        expect(toJSON()).toBeNull();
    });

    it('should render nothing for an unknown account key', async () => {
        const { toJSON } = await renderAccountTypeBadge('unknown-eth-1@2:3' as AccountKey);

        expect(toJSON()).toBeNull();
    });
});
