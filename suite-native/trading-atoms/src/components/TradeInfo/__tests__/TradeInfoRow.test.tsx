import React from 'react';

import { Text } from '@suite-native/atoms';
import { renderWithProviders, userEvent } from '@suite-native/test-utils';

import { TradeInfoRow } from '../TradeInfoRow';

describe('TradeInfoRow', () => {
    const renderTradeInfoRow = (props = {}) =>
        renderWithProviders(<TradeInfoRow {...props} />, { providers: ['intl'] });

    it('should render children content', () => {
        const { getByText } = renderTradeInfoRow({ children: <Text>Test Content</Text> });

        expect(getByText('Test Content')).toBeTruthy();
    });

    it('should render multiple children', () => {
        const { getByText } = renderTradeInfoRow({
            children: (
                <>
                    <Text>First Child</Text>
                    <Text>Second Child</Text>
                    <Text>Third Child</Text>
                </>
            ),
        });

        expect(getByText('First Child')).toBeTruthy();
        expect(getByText('Second Child')).toBeTruthy();
        expect(getByText('Third Child')).toBeTruthy();
    });

    it('should call onPress when pressed', async () => {
        const mockOnPress = jest.fn();
        const { getByTestId } = renderTradeInfoRow({
            onPress: mockOnPress,
            testID: 'trade-info-row',
        });

        await userEvent.press(getByTestId('trade-info-row'));

        expect(mockOnPress).toHaveBeenCalledTimes(1);
    });
});
