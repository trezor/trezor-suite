import { renderWithBasicProvider, screen } from '@suite-native/test-utils';
import { prepareNativeTheme } from '@trezor/theme';

import { StepCardConnector } from './StepCardConnector';

const { colors } = prepareNativeTheme({ colorVariant: 'standard' });

describe('StepCardConnector', () => {
    it('renders a completed connector in the brand color', async () => {
        await renderWithBasicProvider(<StepCardConnector isCompleted />);

        expect(screen.getByTestId('@step-cards/connector/completed')).toHaveStyle({
            backgroundColor: colors.borderBrand,
        });
    });

    it('renders a pending connector in the neutral color', async () => {
        await renderWithBasicProvider(<StepCardConnector isCompleted={false} />);

        expect(screen.getByTestId('@step-cards/connector/pending')).toHaveStyle({
            backgroundColor: colors.borderNeutral,
        });
    });
});
