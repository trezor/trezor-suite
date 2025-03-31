import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { SearchInputWithCancel, SearchInputWithCancelProps } from '../SearchInputWithCancel';

jest.mock('@trezor/react-utils', () => {
    const originalModule = jest.requireActual('@trezor/react-utils');

    return {
        ...originalModule,
        __esModule: true,
        useDebounce: () => async (fn: any) => {
            await fn();
        },
    };
});

describe('SearchInputWithCancel', () => {
    const renderSearchInputWithCancel = (props: Partial<SearchInputWithCancelProps>) =>
        renderWithBasicProvider(<SearchInputWithCancel onChange={jest.fn()} {...props} />);

    it('should render without "Cancel" button by default', async () => {
        const { queryByText } = await renderSearchInputWithCancel({});

        expect(queryByText('Cancel')).toBeNull();
    });

    it('should call onChange callback when text is typed', () => {
        const changeMock = jest.fn();
        const { getByPlaceholderText } = renderSearchInputWithCancel({
            onChange: changeMock,
        });

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

    it('should call onChange with empty value on unmount', () => {
        const onChangeMock = jest.fn();
        const { unmount } = renderSearchInputWithCancel({
            onChange: onChangeMock,
        });

        unmount();

        expect(onChangeMock).toHaveBeenCalledWith('');
    });

    it('should call onChange with empty value when Cancel is pressed', () => {
        const onChangeMock = jest.fn();
        const { getByPlaceholderText, getByText } = renderSearchInputWithCancel({
            onChange: onChangeMock,
        });

        fireEvent(getByPlaceholderText('Search'), 'focus');
        fireEvent.press(getByText('Cancel'));

        expect(onChangeMock).toHaveBeenCalledWith('');
    });
});
