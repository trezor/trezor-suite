import type { ExchangeTrade } from 'invity-api';

import { getTranslation } from '@suite-native/intl';

import { BRIDGE_SPEED_PICKER_TEST_ID, BridgeSpeedPicker } from './BridgeSpeedPicker';
import { renderWithTradingProvider } from '../../../../test-utils/tradingTestUtils';

const circleCctpQuote = {
    exchange: 'circle-cctp',
    send: 'base--0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    receive: 'arbitrum--0xaf88d065e77c8cc2239327c5edb3a432268e5831',
    sendStringAmount: '800',
    receiveStringAmount: '800',
} as ExchangeTrade;

const changellyQuote = {
    exchange: 'changelly',
    send: 'bitcoin',
    receive: 'ethereum',
    sendStringAmount: '0.01',
    receiveStringAmount: '0.3',
} as ExchangeTrade;

describe('BridgeSpeedPicker', () => {
    const renderBridgeSpeedPicker = (
        providerId: string | undefined,
        bridgeSpeed: 'standard' | 'fast' = 'standard',
    ) =>
        renderWithTradingProvider(
            <BridgeSpeedPicker providerId={providerId} onBridgeSpeedConfirmed={jest.fn()} />,
            {
                tradeType: 'exchange',
                overrides: {
                    wallet: {
                        trading: {
                            exchange: {
                                selectedQuote: {
                                    ...(providerId === 'circle-cctp'
                                        ? circleCctpQuote
                                        : changellyQuote),
                                    bridgeSpeed,
                                },
                            },
                        },
                    },
                },
            },
        );

    it('should render null for non-CCTP providers', async () => {
        const { toJSON } = await renderBridgeSpeedPicker('changelly');

        expect(toJSON()).toBeNull();
    });

    it('should render null when providerId is undefined', async () => {
        const { toJSON } = await renderBridgeSpeedPicker(undefined);

        expect(toJSON()).toBeNull();
    });

    it('should render picker for circle-cctp with standard summary', async () => {
        const { getByTestId, getByText } = await renderBridgeSpeedPicker('circle-cctp');

        expect(getByTestId(BRIDGE_SPEED_PICKER_TEST_ID)).toBeOnTheScreen();
        expect(getByText(getTranslation('moduleTrading.bridgeSpeed.label'))).toBeOnTheScreen();
        expect(
            getByText(
                getTranslation('moduleTrading.bridgeSpeed.summary', {
                    title: getTranslation('moduleTrading.bridgeSpeed.standard.title'),
                    fee: getTranslation('moduleTrading.bridgeSpeed.standard.fee'),
                }),
            ),
        ).toBeOnTheScreen();
    });

    it('should render fast summary when bridgeSpeed is fast', async () => {
        const { getByText } = await renderBridgeSpeedPicker('circle-cctp', 'fast');

        expect(
            getByText(
                getTranslation('moduleTrading.bridgeSpeed.summary', {
                    title: getTranslation('moduleTrading.bridgeSpeed.fast.title'),
                    fee: getTranslation('moduleTrading.bridgeSpeed.fast.fee'),
                }),
            ),
        ).toBeOnTheScreen();
    });
});
