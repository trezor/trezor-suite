import { Text } from '@suite-native/atoms';
import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider, screen } from '@suite-native/test-utils';
import { prepareNativeTheme } from '@trezor/theme';

import { CurrentStepCard } from './CurrentStepCard';
import { CurrentStepCardDivider } from './CurrentStepCardDivider';
import { CurrentStepCardHeader } from './CurrentStepCardHeader';

const { colors } = prepareNativeTheme({ colorVariant: 'standard' });

const STEPPER_TEXT = getTranslation('stepCards.stepper', { stepNumber: 2, stepCount: 3 });

describe('CurrentStepCard', () => {
    it('renders the stepper in the brand color and the header content', async () => {
        await renderWithBasicProvider(
            <CurrentStepCard stepNumber={2} stepCount={3}>
                <CurrentStepCardHeader>
                    <Text>Approve spending</Text>
                    <Text>Let the provider use your UNI.</Text>
                </CurrentStepCardHeader>
            </CurrentStepCard>,
        );

        expect(screen.getByText(STEPPER_TEXT)).toHaveStyle({ color: colors.contentBrand });
        expect(screen.getByText('Approve spending')).toBeOnTheScreen();
        expect(screen.getByText('Let the provider use your UNI.')).toBeOnTheScreen();
    });

    it('renders a header with a single line', async () => {
        await renderWithBasicProvider(
            <CurrentStepCard stepNumber={2} stepCount={3}>
                <CurrentStepCardHeader>
                    <Text>Approve spending</Text>
                </CurrentStepCardHeader>
            </CurrentStepCard>,
        );

        expect(screen.getByTestId('@step-cards/current')).toHaveTextContent(
            `${STEPPER_TEXT}Approve spending`,
        );
    });

    it('renders custom children below the header in the given order', async () => {
        await renderWithBasicProvider(
            <CurrentStepCard stepNumber={2} stepCount={3}>
                <CurrentStepCardHeader>
                    <Text>Approve spending</Text>
                </CurrentStepCardHeader>
                <Text>Limit 300 USDT</Text>
                <CurrentStepCardDivider />
                <Text>Network fee $0.01</Text>
            </CurrentStepCard>,
        );

        expect(screen.getByTestId('@step-cards/current')).toHaveTextContent(
            `${STEPPER_TEXT}Approve spendingLimit 300 USDTNetwork fee $0.01`,
        );
    });

    it('does not draw a connector for the first step', async () => {
        await renderWithBasicProvider(
            <CurrentStepCard stepNumber={1} stepCount={3}>
                <CurrentStepCardHeader>
                    <Text>Approve spending</Text>
                </CurrentStepCardHeader>
            </CurrentStepCard>,
        );

        expect(screen.queryByTestId(/@step-cards\/connector/)).not.toBeOnTheScreen();
    });

    it('draws a completed connector for a step after the first one', async () => {
        await renderWithBasicProvider(
            <CurrentStepCard stepNumber={2} stepCount={3}>
                <CurrentStepCardHeader>
                    <Text>Approve spending</Text>
                </CurrentStepCardHeader>
            </CurrentStepCard>,
        );

        expect(screen.getByTestId('@step-cards/connector/completed')).toBeOnTheScreen();
    });
});
