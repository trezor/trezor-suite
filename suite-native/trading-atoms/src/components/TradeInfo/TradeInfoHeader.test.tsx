import React from 'react';

import { Text } from '@suite-native/atoms';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { TradeInfoHeader } from './TradeInfoHeader';

describe('TradeInfoHeader', () => {
    const renderTradeInfoRow = async (title: string, props = {}) =>
        await renderWithBasicProvider(<TradeInfoHeader title={title} {...props} />);

    it('should render title', async () => {
        const { getByText } = await renderTradeInfoRow('Test Title', {});

        expect(getByText('Test Title')).toBeTruthy();
    });

    it('should render rightContent when provided', async () => {
        const { getByText } = await renderTradeInfoRow('Test Title', {
            rightContent: <Text>Right Content</Text>,
        });

        expect(getByText('Test Title')).toBeTruthy();
        expect(getByText('Right Content')).toBeTruthy();
    });
});
