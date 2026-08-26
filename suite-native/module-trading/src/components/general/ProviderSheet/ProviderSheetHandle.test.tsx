import { getTranslation } from '@suite-native/intl';
import { fireEvent } from '@suite-native/test-utils-store';

import { ProviderSheetHandle, type ProviderSheetHandleProps } from './ProviderSheetHandle';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';

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
    const renderProviderSheetHandle = async (
        props: Partial<ProviderSheetHandleProps> = {},
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) =>
        await renderWithTradingProvider(
            <ProviderSheetHandle
                onClose={jest.fn()}
                shouldShowFilters={true}
                selectedFilter="all"
                setSelectedFilter={jest.fn()}
                filterItems={[
                    {
                        label: getTranslation('moduleTrading.providerSheet.filters.allProviders'),
                        value: 'all',
                    },
                    {
                        label: getTranslation('moduleTrading.providerSheet.filters.centralized'),
                        value: 'cex',
                    },
                    {
                        label: getTranslation('moduleTrading.providerSheet.filters.decentralized'),
                        value: 'dex',
                    },
                ]}
                {...props}
            />,
            { overrides },
        );

    it('should render component with title and filter', async () => {
        const { getByText } = await renderProviderSheetHandle({}, {});

        expect(getByText(getTranslation('moduleTrading.providerSheet.title'))).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.providerSheet.filters.allProviders')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.providerSheet.filters.centralized')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.providerSheet.filters.decentralized')),
        ).toBeOnTheScreen();
    });

    it('should not render filters when shouldShowFilters is false', async () => {
        const { getByText, queryByText } = await renderProviderSheetHandle(
            { shouldShowFilters: false },
            {},
        );

        expect(getByText(getTranslation('moduleTrading.providerSheet.title'))).toBeOnTheScreen();
        expect(
            queryByText(getTranslation('moduleTrading.providerSheet.filters.allProviders')),
        ).toBeNull();
        expect(
            queryByText(getTranslation('moduleTrading.providerSheet.filters.centralized')),
        ).toBeNull();
        expect(
            queryByText(getTranslation('moduleTrading.providerSheet.filters.decentralized')),
        ).toBeNull();
    });

    it('should call onClose when close button is pressed', async () => {
        const onClose = jest.fn();
        const { getByLabelText } = await renderProviderSheetHandle({ onClose }, {});

        await fireEvent.press(getByLabelText(getTranslation('generic.buttons.close')));

        expect(onClose).toHaveBeenCalled();
    });

    it('should setSelectedFilter when filter item is pressed', async () => {
        const setSelectedFilter = jest.fn();
        const { getByText } = await renderProviderSheetHandle({ setSelectedFilter }, {});

        await fireEvent.press(
            getByText(getTranslation('moduleTrading.providerSheet.filters.centralized')),
        );

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
