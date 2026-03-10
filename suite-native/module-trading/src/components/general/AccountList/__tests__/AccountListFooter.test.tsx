import { getTranslation } from '@suite-native/intl';
import { act, fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { AccountListFooter, AccountsListFooterProps } from '../AccountListFooter';

describe('AccountListFooter', () => {
    const renderAccountsListFooter = (props: Partial<AccountsListFooterProps>) =>
        renderWithBasicProvider(
            <AccountListFooter hasTextualDivider onAddAccountTap={jest.fn()} {...props} />,
        );

    it('should not render "OR" when hasTextualDivider props is false', () => {
        const { queryByText } = renderAccountsListFooter({ hasTextualDivider: false });

        expect(queryByText(getTranslation('generic.orSeparator'))).toBeNull();
    });

    it('should render "OR" when hasTextualDivider props is true', () => {
        const { getByText } = renderAccountsListFooter({ hasTextualDivider: true });

        expect(getByText(getTranslation('generic.orSeparator'))).toBeTruthy();
    });

    it('should call onAddAccountTap callback on "Add new" button press', () => {
        const onAddAccountTap = jest.fn();
        const { getByText } = renderAccountsListFooter({ onAddAccountTap });

        act(() => {
            fireEvent.press(
                getByText(
                    getTranslation('moduleAddAccounts.coinDiscoveryFinishedScreen.addButton'),
                ),
            );
        });

        expect(onAddAccountTap).toHaveBeenCalledTimes(1);
    });
});
