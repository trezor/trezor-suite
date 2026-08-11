import {
    BasicProviderForTests,
    fireEvent,
    renderHook,
    renderWithBasicProvider,
    within,
} from '@suite-native/test-utils';
import { type NativeStyleUtils, useNativeStyles } from '@trezor/styles-native';
import { type NativeSpacing } from '@trezor/theme';

import { type SubTabItem, SubTabs } from './SubTabs';

const items: SubTabItem<string>[] = [
    {
        label: 'Exchange',
        value: 'exchange',
        icon: 'repeat',
        testID: 'exchange-tab',
    },
    {
        label: 'Buy',
        value: 'buy',
        icon: 'plus',
        testID: 'buy-tab',
    },
];

describe('SubTabs', () => {
    let colors: NativeStyleUtils['colors'];

    beforeAll(() => {
        const { result } = renderHook(() => useNativeStyles(), { wrapper: BasicProviderForTests });
        ({ colors } = result.current.utils);
    });

    const renderSubTabs = ({
        onChange = jest.fn(),
        paddingHorizontal,
        size = 'normal',
        value = 'exchange',
    }: {
        onChange?: (value: string) => void;
        paddingHorizontal?: NativeSpacing;
        size?: 'normal' | 'large';
        value?: string;
    } = {}) =>
        renderWithBasicProvider(
            <SubTabs
                items={items}
                onChange={onChange}
                paddingHorizontal={paddingHorizontal}
                size={size}
                testID="sub-tabs"
                value={value}
            />,
        );

    it('renders the active and inactive tabs with accessible selected states', () => {
        const { getByRole } = renderSubTabs();

        const activeTab = getByRole('tab', { selected: true });
        const inactiveTab = getByRole('tab', { selected: false });

        expect(within(activeTab).getByText('Exchange')).toBeOnTheScreen();
        expect(within(inactiveTab).getByText('Buy')).toBeOnTheScreen();
    });

    it('calls onChange with the pressed tab value', () => {
        const onChange = jest.fn();
        const { getByText } = renderSubTabs({ onChange });

        fireEvent.press(getByText('Buy'));

        expect(onChange).toHaveBeenCalledWith('buy');
    });

    it('applies configurable horizontal padding to the tab list', () => {
        const { getByTestId } = renderSubTabs({ paddingHorizontal: 'sp4' });

        expect(getByTestId('sub-tabs').props.contentContainerStyle).toEqual(
            expect.objectContaining({ paddingHorizontal: 4 }),
        );
    });

    it('uses normal size dimensions, typography, icon size, and active colors', () => {
        const { getByTestId } = renderSubTabs();

        expect(getByTestId('exchange-tab')).toHaveStyle({
            height: 36,
            backgroundColor: colors.elementFillElevated,
            borderRadius: 100,
            gap: 8,
            borderBottomWidth: 2,
            paddingVertical: 8,
            paddingHorizontal: 16,
        });
        expect(getByTestId('exchange-tab/icon')).toHaveStyle({ fontSize: 20, lineHeight: 20 });
        expect(getByTestId('exchange-tab/text')).toHaveStyle({
            color: colors.contentPrimary,
            fontSize: 14,
            lineHeight: 20,
        });
        expect(getByTestId('buy-tab')).toHaveStyle({ backgroundColor: 'transparent' });
        expect(getByTestId('buy-tab/text')).toHaveStyle({ color: colors.contentSecondary });
    });

    it('uses large size dimensions, typography, and icon size', () => {
        const { getByTestId } = renderSubTabs({ size: 'large' });

        expect(getByTestId('exchange-tab')).toHaveStyle({
            height: 40,
            borderRadius: 100,
            gap: 8,
            paddingVertical: 8,
            paddingHorizontal: 16,
        });
        expect(getByTestId('exchange-tab')).not.toHaveStyle({ borderBottomWidth: 2 });
        expect(getByTestId('exchange-tab/icon')).toHaveStyle({ fontSize: 24, lineHeight: 24 });
        expect(getByTestId('exchange-tab/text')).toHaveStyle({ fontSize: 16, lineHeight: 24 });
    });
});
