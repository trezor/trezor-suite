import { act, fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { TradeAccountsListFooter, TradeAccountsListFooterProps } from '../TradeAccountsListFooter';

describe('TradeAccountsListFooter', () => {
    const renderTradeAccountsListFooter = (props: Partial<TradeAccountsListFooterProps>) =>
        renderWithBasicProvider(
            <TradeAccountsListFooter hasTextualDivider onAddAccountTap={jest.fn()} {...props} />,
        );

    it('should not render "OR" when hasTextualDivider props is false', () => {
        const { queryByText } = renderTradeAccountsListFooter({ hasTextualDivider: false });

        expect(queryByText('OR')).toBeNull();
    });

    it('should render "OR" when hasTextualDivider props is true', () => {
        const { getByText } = renderTradeAccountsListFooter({ hasTextualDivider: true });

        expect(getByText('OR')).toBeDefined();
    });

    it('should call onAddAccountTap callback on "Add new" button press', () => {
        const onAddAccountTap = jest.fn();
        const { getByText } = renderTradeAccountsListFooter({ onAddAccountTap });

        act(() => {
            fireEvent.press(getByText('Add new'));
        });

        expect(onAddAccountTap).toHaveBeenCalledTimes(1);
    });
});
