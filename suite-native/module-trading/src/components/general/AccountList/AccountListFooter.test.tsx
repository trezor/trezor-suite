import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { AccountListFooter } from './AccountListFooter';

describe('AccountListFooter', () => {
    it('renders a standalone add account action', () => {
        const onAddAccountTap = jest.fn();
        const { getByText } = renderWithBasicProvider(
            <AccountListFooter onAddAccountTap={onAddAccountTap} />,
        );

        fireEvent.press(
            getByText(getTranslation('moduleAddAccounts.coinDiscoveryFinishedScreen.addButton')),
        );

        expect(onAddAccountTap).toHaveBeenCalledTimes(1);
    });
});
