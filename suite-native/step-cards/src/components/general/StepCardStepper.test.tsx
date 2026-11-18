import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider, screen } from '@suite-native/test-utils';

import { StepCardStepper } from './StepCardStepper';

describe('StepCardStepper', () => {
    it('renders the step number out of the step count', async () => {
        await renderWithBasicProvider(
            <StepCardStepper stepNumber={2} stepCount={7} color="contentBrand" />,
        );

        expect(
            screen.getByText(getTranslation('stepCards.stepper', { stepNumber: 2, stepCount: 7 })),
        ).toBeOnTheScreen();
    });
});
