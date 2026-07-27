import { type AccountKey, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import type { StaticSessionId } from '@trezor/connect';

import { AccountTypeBadge } from '../AccountTypeBadge';

const MOCK_ACCOUNT_DEVICE_SESSION_ID: StaticSessionId = '1@2:3';

describe('AccountTypeBadge', () => {
    const ethNormalAccount = mockWalletAccount({
        symbol: 'eth',
        deviceState: MOCK_ACCOUNT_DEVICE_SESSION_ID,
        accountType: 'normal',
        descriptor: asAccountDescriptor('eth1normal'),
        visible: true,
    });

    const ethLedgerAccount = mockWalletAccount({
        symbol: 'eth',
        deviceState: MOCK_ACCOUNT_DEVICE_SESSION_ID,
        accountType: 'ledger',
        descriptor: asAccountDescriptor('eth1ledger'),
        visible: true,
    });

    const accounts = [ethNormalAccount, ethLedgerAccount];

    const renderAccountTypeBadge = (accountKey: AccountKey) =>
        renderWithStoreProvider(<AccountTypeBadge accountKey={accountKey} />, {
            preloadedState: { wallet: { accounts } },
        });

    it('should render the formatted account type', () => {
        const { getByText } = renderAccountTypeBadge(ethLedgerAccount.key);

        expect(getByText('Ledger')).toBeOnTheScreen();
    });

    it('should render nothing for an account type without a formatted name', () => {
        const { toJSON } = renderAccountTypeBadge(ethNormalAccount.key);

        expect(toJSON()).toBeNull();
    });

    it('should render nothing for an unknown account key', () => {
        const { toJSON } = renderAccountTypeBadge('unknown-eth-1@2:3' as AccountKey);

        expect(toJSON()).toBeNull();
    });
});
