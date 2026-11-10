import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { BigNumber } from '@trezor/utils';

import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { FiatAmountHeadline } from './FiatAmountHeadline';
import { type MockSuiteState, mockInitialAppState } from '../../../../mocks/mockInitialAppState';

const renderHeadline = (language: MockSuiteState['suiteSettings']['language']) => {
    const { services } = createTestCompositionRoot<void, MockSuiteState>({
        preloadedState: {
            ...mockInitialAppState,
            suiteSettings: { ...mockInitialAppState.suiteSettings, language },
        },
    });

    renderWithProviders(
        services,
        <FiatAmountHeadline fiatValue={new BigNumber('1234.5')} data-testid="@headline" />,
    );

    return screen.getByTestId('@headline');
};

describe(FiatAmountHeadline.name, () => {
    it('writes the symbol right before the amount where the locale does', () => {
        expect(renderHeadline('en-US').textContent).toBe('$1,234.50');
    });

    it('keeps the space the locale puts between the amount and its symbol', () => {
        expect(renderHeadline('cs-CZ').textContent).toBe('1 234,50 US$');
    });
});
