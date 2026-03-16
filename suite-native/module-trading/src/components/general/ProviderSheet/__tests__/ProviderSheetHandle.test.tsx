import {
    type PreloadedState,
    fireEvent,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { ProviderSheetHandle, type ProviderSheetHandleProps } from '../ProviderSheetHandle';

jest.mock('@suite-common/message-system', () => {
    const messages: Record<string, unknown> = {
        'trading.exchange': {
            content: 'Trading exchange message',
        },
    };

    return {
        ...jest.requireActual('@suite-common/message-system'),
        selectContextMessageContent: (_: unknown, context: string) => messages[context],
    };
});

describe('ProviderSheetHandle', () => {
    const renderProviderSheetHandle = (
        props: Partial<ProviderSheetHandleProps> = {},
        preloadedState: PreloadedState = {},
    ) =>
        renderWithStoreProviderAsync(
            <ProviderSheetHandle
                onClose={jest.fn()}
                shouldShowFilters={true}
                selectedFilter="all"
                setSelectedFilter={jest.fn()}
                filterItems={[
                    { label: 'All', value: 'all' },
                    { label: 'CEX', value: 'cex' },
                    { label: 'DEX', value: 'dex' },
                ]}
                {...props}
            />,
            { preloadedState },
        );

    it('should render component with title and filter', async () => {
        const { getByText } = await renderProviderSheetHandle({}, {});

        expect(getByText('Providers')).toBeOnTheScreen();
        expect(getByText('All')).toBeOnTheScreen();
        expect(getByText('CEX')).toBeOnTheScreen();
        expect(getByText('DEX')).toBeOnTheScreen();
    });

    it('should not render filters when shouldShowFilters is false', async () => {
        const { getByText, queryByText } = await renderProviderSheetHandle(
            { shouldShowFilters: false },
            {},
        );

        expect(getByText('Providers')).toBeOnTheScreen();
        expect(queryByText('All')).toBeNull();
        expect(queryByText('CEX')).toBeNull();
        expect(queryByText('DEX')).toBeNull();
    });

    it('should call onClose when close button is pressed', async () => {
        const onClose = jest.fn();
        const { getByLabelText } = await renderProviderSheetHandle({ onClose }, {});

        fireEvent.press(getByLabelText('Close'));

        expect(onClose).toHaveBeenCalled();
    });

    it('should setSelectedFilter when filter item is pressed', async () => {
        const setSelectedFilter = jest.fn();
        const { getByText } = await renderProviderSheetHandle({ setSelectedFilter }, {});

        fireEvent.press(getByText('CEX'));

        expect(setSelectedFilter).toHaveBeenCalledWith('cex');
    });

    it('should display context message', async () => {
        const { getByText } = await renderProviderSheetHandle(
            {},
            {
                wallet: {
                    trading: {
                        activeTradingType: 'exchange',
                    },
                },
            },
        );

        expect(getByText('Trading exchange message')).toBeOnTheScreen();
    });
});
