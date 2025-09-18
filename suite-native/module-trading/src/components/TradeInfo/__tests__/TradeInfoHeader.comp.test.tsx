import React from 'react';

import { Text } from '@suite-native/atoms';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { TradeInfoHeader } from '../TradeInfoHeader';

describe('TradeInfoHeader', () => {
    const renderTradeInfoRow = (title: string, props = {}) =>
        renderWithBasicProvider(<TradeInfoHeader title={title} {...props} />);

    it('should render title', () => {
        const { getByText } = renderTradeInfoRow('Test Title', {});

        expect(getByText('Test Title')).toBeTruthy();
    });

    it('should render rightContent when provided', () => {
        const { getByText } = renderTradeInfoRow('Test Title', {
            rightContent: <Text>Right Content</Text>,
        });

        expect(getByText('Test Title')).toBeTruthy();
        expect(getByText('Right Content')).toBeTruthy();
    });
});
