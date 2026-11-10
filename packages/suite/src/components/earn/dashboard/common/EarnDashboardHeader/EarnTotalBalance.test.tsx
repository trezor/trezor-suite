import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { BigNumber } from '@trezor/utils';

import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { EarnTotalBalance } from './EarnTotalBalance';
import {
    type MockSuiteState,
    mockInitialAppState,
} from '../../../../../../mocks/mockInitialAppState';

type RenderParams = {
    language: MockSuiteState['suiteSettings']['language'];
    isIncomplete?: boolean;
};

const renderTotal = ({ language, isIncomplete }: RenderParams) => {
    const { services } = createTestCompositionRoot<void, MockSuiteState>({
        preloadedState: {
            ...mockInitialAppState,
            suiteSettings: { ...mockInitialAppState.suiteSettings, language },
        },
    });

    renderWithProviders(
        services,
        <EarnTotalBalance
            fiatValue={new BigNumber('1234.5')}
            isIncomplete={isIncomplete}
            dataTestId="@total"
        />,
    );

    return screen.getByTestId('@total').textContent;
};

describe(EarnTotalBalance.name, () => {
    it('writes the symbol right before the amount where the locale does', () => {
        expect(renderTotal({ language: 'en-US' })).toBe('$1,234.50');
    });

    it('keeps the space the locale puts between the amount and the symbol after it', () => {
        expect(renderTotal({ language: 'cs-CZ' })).toBe('1\u00a0234,50\u00a0US$');
    });

    it('marks a total that leaves something out as approximate', () => {
        expect(renderTotal({ language: 'en-US', isIncomplete: true })).toBe('≈$1,234.50');
    });
});
