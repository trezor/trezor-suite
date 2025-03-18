import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { TradeableAssetsSheetHeader } from '../TradeableAssetsSheetHeader';

describe('TradeableAssetsSheetHeader', () => {
    const renderComponent = (onClose = jest.fn()) =>
        renderWithBasicProvider(<TradeableAssetsSheetHeader onClose={onClose} />);

    it('should display "Coins" and do not display tabs by default', () => {
        const { getByText, queryByText } = renderComponent();

        expect(getByText('Coins')).toBeDefined();
        expect(queryByText('All')).toBeNull();
    });

    it('should display tabs after focusing search input', () => {
        const { getByPlaceholderText, getByText, queryByText } = renderComponent();

        fireEvent(getByPlaceholderText('Search'), 'focus');

        expect(getByText('All')).toBeDefined();
        expect(queryByText('Coins')).toBeNull();
    });

    it('should not display cancel button by default', () => {
        const { queryByText } = renderComponent();

        expect(queryByText('Cancel')).toBeNull();
    });

    it('should display cancel button after focusing search input', () => {
        const { getByPlaceholderText, getByText } = renderComponent();

        fireEvent(getByPlaceholderText('Search'), 'focus');

        expect(getByText('Cancel')).toBeDefined();
    });

    it('should call onClose when close button is pressed ', () => {
        const onClose = jest.fn();
        const { getByLabelText } = renderComponent(onClose);

        fireEvent.press(getByLabelText('Close'));

        expect(onClose).toHaveBeenCalled();
    });
});
