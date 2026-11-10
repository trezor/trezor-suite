import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { BigNumber } from '@trezor/utils';

import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { FiatAmountHeadline } from './FiatAmountHeadline';
import { type MockSuiteState, mockInitialAppState } from '../../../../mocks/mockInitialAppState';

type RenderParams = {
    language: MockSuiteState['suiteSettings']['language'];
    localCurrency: MockSuiteState['wallet']['settings']['localCurrency'];
};

const renderHeadline = ({ language, localCurrency }: RenderParams) => {
    const { services } = createTestCompositionRoot<void, MockSuiteState>({
        preloadedState: {
            ...mockInitialAppState,
            suiteSettings: { ...mockInitialAppState.suiteSettings, language },
            wallet: {
                ...mockInitialAppState.wallet,
                settings: { ...mockInitialAppState.wallet.settings, localCurrency },
            },
        },
    });

    renderWithProviders(
        services,
        <FiatAmountHeadline fiatValue={new BigNumber('1234.5')} data-testid="@headline" />,
    );

    return screen.getByTestId('@headline').textContent;
};

describe(FiatAmountHeadline.name, () => {
    it('writes the symbol right before the amount where the locale does', () => {
        expect(renderHeadline({ language: 'en-US', localCurrency: 'usd' })).toBe('$1,234.50');
    });

    it('keeps the space the locale puts between the amount and the symbol after it', () => {
        expect(renderHeadline({ language: 'cs-CZ', localCurrency: 'usd' })).toBe(
            '1\u00a0234,50\u00a0US$',
        );
    });

    it('keeps the space the locale puts between a leading currency code and the amount', () => {
        expect(renderHeadline({ language: 'en-US', localCurrency: 'czk' })).toBe(
            'CZK\u00a01,234.50',
        );
    });
});
