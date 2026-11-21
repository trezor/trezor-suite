import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { messages } from '@suite/intl';
import { createTestCompositionRoot } from '@suite-common/test-utils';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { ApyValue } from './ApyValue';
import { type MockSuiteState, mockInitialAppState } from '../../../../../mocks/mockInitialAppState';

const renderApyValue = (element: React.ReactElement) => {
    const { services } = createTestCompositionRoot<void, MockSuiteState>({
        preloadedState: mockInitialAppState,
    });

    renderWithProviders(services, <span data-testid="apy">{element}</span>);

    return screen.getByTestId('apy');
};

describe('ApyValue', () => {
    it('shows an approximate rate', () => {
        expect(renderApyValue(<ApyValue apy={3.2} />)).toHaveTextContent('~3.2%');
    });

    it.each([
        { name: 'no rate', apy: null },
        { name: 'a zero rate', apy: 0 },
    ])('is not available for $name', ({ apy }) => {
        expect(renderApyValue(<ApyValue apy={apy} />)).toHaveTextContent(
            messages.TR_EARN_APY_N_A.defaultMessage,
        );
    });

    it('shows a zero rate for a position that earns nothing, whatever its rate', () => {
        expect(renderApyValue(<ApyValue apy={3.2} isNotEarning />)).toHaveTextContent('0%');
    });
});
