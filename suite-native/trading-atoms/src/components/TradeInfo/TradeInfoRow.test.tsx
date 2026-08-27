import React from 'react';

import { Text } from '@suite-native/atoms';
import { renderWithBasicProvider, userEvent } from '@suite-native/test-utils';

import { TradeInfoRow } from './TradeInfoRow';

describe('TradeInfoRow', () => {
    const renderTradeInfoRow = async (props = {}) =>
        await renderWithBasicProvider(<TradeInfoRow {...props} />);

    it('should render children content', async () => {
        const { getByText } = await renderTradeInfoRow({ children: <Text>Test Content</Text> });

        expect(getByText('Test Content')).toBeTruthy();
    });

    it('should render multiple children', async () => {
        const { getByText } = await renderTradeInfoRow({
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
        const { getByTestId } = await renderTradeInfoRow({
            onPress: mockOnPress,
            testID: 'trade-info-row',
        });

        await userEvent.press(getByTestId('trade-info-row'));

        expect(mockOnPress).toHaveBeenCalledTimes(1);
    });
});
