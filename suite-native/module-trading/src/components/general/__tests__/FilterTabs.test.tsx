import { fireEvent, renderWithStoreProvider, within } from '@suite-native/test-utils-store';
import { type FilterItem, FilterTabs } from '@suite-native/trading-atoms';

describe('FilterTabs', () => {
    const items: FilterItem<string>[] = [
        { label: 'All', value: 'all' },
        { label: 'Bitcoin', value: 'btc' },
        { label: 'Ethereum', value: 'eth' },
    ];

    const renderComponent = (
        onChange = jest.fn(),
        value = 'all',
        keyExtractor?: (item: FilterItem<string>) => string,
    ) =>
        renderWithStoreProvider(
            <FilterTabs
                items={items}
                onChange={onChange}
                value={value}
                keyExtractor={keyExtractor}
            />,
        );

    it('should render all filter tabs', () => {
        const { getByText } = renderComponent();

        expect(getByText('All')).toBeTruthy();
        expect(getByText('Bitcoin')).toBeTruthy();
        expect(getByText('Ethereum')).toBeTruthy();
    });

    it('should call onChange with the correct value when a tab is pressed', () => {
        const onChange = jest.fn();
        const { getByText } = renderComponent(onChange);

        const bitcoinTab = getByText('Bitcoin');
        expect(bitcoinTab).toBeTruthy();
        fireEvent.press(bitcoinTab!);

        expect(onChange).toHaveBeenCalledWith('btc');
    });

    it('should have the correct tab active based on the value prop', () => {
        const { getByRole } = renderComponent(jest.fn(), 'btc');

        const activeTab = getByRole('tab', { selected: true });
        expect(within(activeTab).getByText('Bitcoin')).toBeTruthy();

        const inactiveTab = getByRole('tab', { selected: false, name: 'All' });
        expect(within(inactiveTab).getByText('All')).toBeTruthy();
    });

    it('should use custom keyExtractor if provided', () => {
        const keyExtractor = jest.fn(item => item.label);
        renderComponent(jest.fn(), 'all', keyExtractor);
        expect(keyExtractor).toHaveBeenCalledWith(items[0]);
        expect(keyExtractor).toHaveBeenCalledWith(items[1]);
        expect(keyExtractor).toHaveBeenCalledWith(items[2]);
    });
});
