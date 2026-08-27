import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { AccountListFooter } from './AccountListFooter';

describe('AccountListFooter', () => {
    it('renders a standalone add account action', async () => {
        const onAddAccountTap = jest.fn();
        const { getByText } = await renderWithBasicProvider(
            <AccountListFooter onAddAccountTap={onAddAccountTap} />,
        );

        await fireEvent.press(
            getByText(getTranslation('moduleAddAccounts.coinDiscoveryFinishedScreen.addButton')),
        );

        expect(onAddAccountTap).toHaveBeenCalledTimes(1);
    });
});
