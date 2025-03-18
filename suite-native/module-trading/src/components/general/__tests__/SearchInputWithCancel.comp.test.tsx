import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { SearchInputWithCancel, SearchInputWithCancelProps } from '../SearchInputWithCancel';

describe('SearchInputWithCancel', () => {
    const renderSearchInputWithCancel = (props: Partial<SearchInputWithCancelProps>) =>
        renderWithBasicProvider(<SearchInputWithCancel onChange={jest.fn()} {...props} />);

    it('should render without "Cancel" button by default', () => {
        const { queryByText } = renderSearchInputWithCancel({});

        expect(queryByText('Cancel')).toBeNull();
    });

    it('should call onChange callback when text is typed', () => {
        const changeMock = jest.fn();
        const { getByPlaceholderText } = renderSearchInputWithCancel({ onChange: changeMock });

        fireEvent.changeText(getByPlaceholderText('Search'), 'test');

        expect(changeMock).toHaveBeenCalledTimes(1);
    });

    it('should call onFocus and display "Cancel" button on input focus', () => {
        const focusMock = jest.fn();
        const { getByText, getByPlaceholderText } = renderSearchInputWithCancel({
            onFocus: focusMock,
        });

        fireEvent(getByPlaceholderText('Search'), 'focus');

        expect(getByText('Cancel')).toBeDefined();
        expect(focusMock).toHaveBeenCalledTimes(1);
    });
});
