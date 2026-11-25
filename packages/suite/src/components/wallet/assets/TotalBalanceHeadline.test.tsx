import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { TotalBalanceHeadline } from '@suite/assets';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { BigNumber } from '@trezor/utils';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { type MockSuiteState, mockInitialAppState } from '../../../../mocks/mockInitialAppState';

type RenderParams = {
    language: MockSuiteState['suiteSettings']['language'];
    isApproximate?: boolean;
};

const renderTotal = ({ language, isApproximate }: RenderParams) => {
    const { services } = createTestCompositionRoot<void, MockSuiteState>({
        preloadedState: {
            ...mockInitialAppState,
            suiteSettings: { ...mockInitialAppState.suiteSettings, language },
        },
    });

    renderWithProviders(
        services,
        <TotalBalanceHeadline
            fiatValue={new BigNumber('1234.5')}
            isApproximate={isApproximate}
            data-testid="@total"
        />,
    );

    return screen.getByTestId('@total').textContent;
};

describe(TotalBalanceHeadline.name, () => {
    it.each<{ description: string; params: RenderParams; expected: string }>([
        {
            description: 'writes the symbol right before the amount where the locale does',
            params: { language: 'en-US' },
            expected: '$1,234.50',
        },
        {
            description:
                'keeps the space the locale puts between the amount and the symbol after it',
            params: { language: 'cs-CZ' },
            expected: '1\u00a0234,50\u00a0US$',
        },
        {
            description: 'marks a total that leaves something out as approximate',
            params: { language: 'en-US', isApproximate: true },
            expected: '≈$1,234.50',
        },
    ])('$description', ({ params, expected }) => {
        expect(renderTotal(params)).toBe(expected);
    });
});
