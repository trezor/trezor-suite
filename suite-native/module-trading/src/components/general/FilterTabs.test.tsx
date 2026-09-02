import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithStoreProvider, within } from '@suite-native/test-utils-store';
import { type FilterItem, FilterTabs } from '@suite-native/trading-atoms';

describe('FilterTabs', () => {
    const items: FilterItem<string>[] = [
        {
            label: getTranslation('moduleTrading.tradeableAssetsSheet.allFilterTabTitle'),
            value: 'all',
        },
        { label: 'Bitcoin', value: 'btc' },
        { label: 'Ethereum', value: 'eth' },
    ];

    const renderComponent = async (
        onChange = jest.fn(),
        value = 'all',
        keyExtractor?: (item: FilterItem<string>) => string,
    ) =>
        await renderWithStoreProvider(
            <FilterTabs
                items={items}
                onChange={onChange}
                value={value}
                keyExtractor={keyExtractor}
            />,
        );

    it('should render all filter tabs', async () => {
        const { getByText } = await renderComponent();

        expect(
            getByText(getTranslation('moduleTrading.tradeableAssetsSheet.allFilterTabTitle')),
        ).toBeTruthy();
        expect(getByText('Bitcoin')).toBeTruthy();
        expect(getByText('Ethereum')).toBeTruthy();
    });

    it('should call onChange with the correct value when a tab is pressed', async () => {
        const onChange = jest.fn();
        const { getByText } = await renderComponent(onChange);

        const bitcoinTab = getByText('Bitcoin');
        expect(bitcoinTab).toBeTruthy();
        await fireEvent.press(bitcoinTab!);

        expect(onChange).toHaveBeenCalledWith('btc');
    });

    it('should have the correct tab active based on the value prop', async () => {
        const { getByRole } = await renderComponent(jest.fn(), 'btc');

        const activeTab = getByRole('tab', { selected: true });
        expect(within(activeTab).getByText('Bitcoin')).toBeTruthy();

        const inactiveTab = getByRole('tab', {
            selected: false,
            name: getTranslation('moduleTrading.tradeableAssetsSheet.allFilterTabTitle'),
        });
        expect(
            within(inactiveTab).getByText(
                getTranslation('moduleTrading.tradeableAssetsSheet.allFilterTabTitle'),
            ),
        ).toBeTruthy();
    });

    it('should use custom keyExtractor if provided', async () => {
        const keyExtractor = jest.fn(item => item.label);
        await renderComponent(jest.fn(), 'all', keyExtractor);
        expect(keyExtractor).toHaveBeenCalledWith(items[0]);
        expect(keyExtractor).toHaveBeenCalledWith(items[1]);
        expect(keyExtractor).toHaveBeenCalledWith(items[2]);
    });
});
