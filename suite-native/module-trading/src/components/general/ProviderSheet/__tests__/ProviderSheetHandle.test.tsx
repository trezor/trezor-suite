import { fireEvent } from '@suite-native/test-utils-store';

import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../../../__tests__/tradingTestUtils';
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
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) =>
        renderWithTradingProvider(
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
            { overrides, providers: ['intl'] },
        );

    it('should render component with title and filter', () => {
        const { getByText } = renderProviderSheetHandle({}, {});

        expect(getByText('Providers')).toBeOnTheScreen();
        expect(getByText('All')).toBeOnTheScreen();
        expect(getByText('CEX')).toBeOnTheScreen();
        expect(getByText('DEX')).toBeOnTheScreen();
    });

    it('should not render filters when shouldShowFilters is false', () => {
        const { getByText, queryByText } = renderProviderSheetHandle(
            { shouldShowFilters: false },
            {},
        );

        expect(getByText('Providers')).toBeOnTheScreen();
        expect(queryByText('All')).toBeNull();
        expect(queryByText('CEX')).toBeNull();
        expect(queryByText('DEX')).toBeNull();
    });

    it('should call onClose when close button is pressed', () => {
        const onClose = jest.fn();
        const { getByLabelText } = renderProviderSheetHandle({ onClose }, {});

        fireEvent.press(getByLabelText('Close'));

        expect(onClose).toHaveBeenCalled();
    });

    it('should setSelectedFilter when filter item is pressed', () => {
        const setSelectedFilter = jest.fn();
        const { getByText } = renderProviderSheetHandle({ setSelectedFilter }, {});

        fireEvent.press(getByText('CEX'));

        expect(setSelectedFilter).toHaveBeenCalledWith('cex');
    });

    it('should display context message', () => {
        const { getByText } = renderProviderSheetHandle(
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
