import { type BottomSheetSearchInputProps } from '@suite-native/atoms';
import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { BottomSheetSearchInputWithCancel } from './BottomSheetSearchInputWithCancel';

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
    const renderSearchInputWithCancel = async (props: Partial<BottomSheetSearchInputProps>) =>
        await renderWithBasicProvider(
            <BottomSheetSearchInputWithCancel onChange={jest.fn()} {...props} />,
        );

    it('should render without "Cancel" button by default', async () => {
        const { queryByText } = await renderSearchInputWithCancel({});

        expect(queryByText(getTranslation('generic.buttons.cancel'))).toBeNull();
    });

    it('should call onChange callback when text is typed', async () => {
        const changeMock = jest.fn();
        const { getByPlaceholderText } = await renderSearchInputWithCancel({
            onChange: changeMock,
        });

        await fireEvent.changeText(getByPlaceholderText('Search'), 'test');

        expect(changeMock).toHaveBeenCalledTimes(1);
    });

    it('should call onFocus and display "Cancel" button on input focus', async () => {
        const focusMock = jest.fn();
        const { getByText, getByPlaceholderText } = await renderSearchInputWithCancel({
            onFocus: focusMock,
        });

        await fireEvent(getByPlaceholderText('Search'), 'focus');

        expect(getByText(getTranslation('generic.buttons.cancel'))).toBeTruthy();
        expect(focusMock).toHaveBeenCalledTimes(1);
    });

    it('should call onChange with empty value on unmount', async () => {
        const onChangeMock = jest.fn();
        const { unmount } = await renderSearchInputWithCancel({
            onChange: onChangeMock,
        });

        await unmount();

        expect(onChangeMock).toHaveBeenCalledWith('');
    });

    it('should call onChange with empty value when Cancel is pressed', async () => {
        const onChangeMock = jest.fn();
        const { getByPlaceholderText, getByText } = await renderSearchInputWithCancel({
            onChange: onChangeMock,
        });

        await fireEvent(getByPlaceholderText('Search'), 'focus');
        await fireEvent.press(getByText(getTranslation('generic.buttons.cancel')));

        expect(onChangeMock).toHaveBeenCalledWith('');
    });
});
