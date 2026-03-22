import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { renderWithStoreProvider } from '@suite-native/test-utils';
import type { StaticSessionId } from '@trezor/connect';

import { AccountLabel, type AccountLabelPropsWithAccount } from '../AccountLabel';

const MOCK_ACCOUNT_DEVICE_SESSION_ID: StaticSessionId = '1@2:3';

describe('AccountLabel', () => {
    const ethAccount = mockWalletAccount({
        symbol: 'eth',
        accountLabel: 'ETH Account #1',
        deviceState: MOCK_ACCOUNT_DEVICE_SESSION_ID,

        accountType: 'normal',
        descriptor: asAccountDescriptor('eth1-normal'),
        visible: true,
    });

    const renderAccountLabel = (props: AccountLabelPropsWithAccount) =>
        renderWithStoreProvider(<AccountLabel {...props} />, {
            preloadedState: { wallet: { accounts: [ethAccount] } },
        });

    it('should render account label when account is provided', () => {
        const { getByText } = renderAccountLabel({ account: ethAccount });

        expect(getByText('ETH Account #1')).toBeOnTheScreen();
    });

    it('should render account label when descriptors are provided', () => {
        const { getByText } = renderAccountLabel({
            deviceStaticSessionId: ethAccount.deviceState,
            networkSymbol: ethAccount.symbol,
            accountDescriptor: ethAccount.descriptor,
        });

        expect(getByText('ETH Account #1')).toBeOnTheScreen();
    });

    it('should render nothing when accountLabel is not found', () => {
        const { toJSON } = renderAccountLabel({
            deviceStaticSessionId: ethAccount.deviceState,
            networkSymbol: 'btc',
            accountDescriptor: ethAccount.descriptor,
        });

        expect(toJSON()).toBeNull();
    });

    it('should propagate text props', () => {
        const { getByText } = renderAccountLabel({
            account: ethAccount,
            accessibilityLabel: 'ACCESSIBILITY_LABEL',
        });

        expect(getByText('ETH Account #1')).toHaveProp('accessibilityLabel', 'ACCESSIBILITY_LABEL');
    });
});
