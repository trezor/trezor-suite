import { Account } from '@suite-common/wallet-types';
import { fireEvent, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { ReceiveAccount } from '../../../../types';
import { AccountListItem } from '../AccountListItem';

jest.mock('@suite-common/wallet-core', () => {
    const fiatRate = { rate: 1e8 };

    return {
        ...jest.requireActual('@suite-common/wallet-core'),
        selectFiatRatesByFiatRateKey: () => fiatRate,
    };
});

describe('AccountListItem', () => {
    const onPressMock = jest.fn();

    const renderAccountListItem = (receiveAccount: ReceiveAccount) =>
        renderWithStoreProviderAsync(
            <AccountListItem onPress={onPressMock} receiveAccount={receiveAccount} />,
        );

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should call onPress callback when pressed', async () => {
        const receiveAccount: ReceiveAccount = {
            account: {
                key: 'btc1',
                symbol: 'btc',
                accountLabel: 'My BTC account',
                availableBalance: '10000000',
            } as Account,
        };
        const { getByText } = await renderAccountListItem(receiveAccount);

        fireEvent.press(getByText('My BTC account'));

        expect(onPressMock).toHaveBeenCalled();
    });

    it('should render account name', async () => {
        const receiveAccount: ReceiveAccount = {
            account: {
                key: 'btc1',
                symbol: 'btc',
                accountLabel: 'My BTC account',
                availableBalance: '10000000',
            } as Account,
        };
        const { getByText, queryByAccessibilityHint, getByLabelText } =
            await renderAccountListItem(receiveAccount);

        expect(getByText('My BTC account')).toBeDefined();
        expect(queryByAccessibilityHint('Select to display account addresses')).toBeNull();
        expect(getByLabelText('Balance in fiat')).toHaveTextContent('$10,000,000.00');
        expect(getByLabelText('Balance in crypto')).toHaveTextContent('0.1 BTC');
    });

    it('should display caret when account defines addresses', async () => {
        const receiveAccount: ReceiveAccount = {
            account: {
                key: 'btc1',
                symbol: 'btc',
                accountLabel: 'My BTC account',
                availableBalance: '10000000',
                addresses: {
                    change: [],
                    used: [],
                    unused: [],
                },
            } as unknown as Account,
        };
        const { getByText, getByAccessibilityHint } = await renderAccountListItem(receiveAccount);

        expect(getByText('My BTC account')).toBeDefined();
        expect(getByAccessibilityHint('Select to display account addresses')).toBeDefined();
    });
});
