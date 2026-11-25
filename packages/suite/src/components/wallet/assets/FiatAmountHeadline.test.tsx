import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { FiatAmountHeadline } from '@suite/assets';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { BigNumber } from '@trezor/utils';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

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
    it.each<{ description: string; params: RenderParams; expected: string }>([
        {
            description: 'writes the symbol right before the amount where the locale does',
            params: { language: 'en-US', localCurrency: 'usd' },
            expected: '$1,234.50',
        },
        {
            description:
                'keeps the space the locale puts between the amount and the symbol after it',
            params: { language: 'cs-CZ', localCurrency: 'usd' },
            expected: '1\u00a0234,50\u00a0US$',
        },
        {
            description:
                'keeps the space the locale puts between a leading currency code and the amount',
            params: { language: 'en-US', localCurrency: 'czk' },
            expected: 'CZK\u00a01,234.50',
        },
    ])('$description', ({ params, expected }) => {
        expect(renderHeadline(params)).toBe(expected);
    });
});
