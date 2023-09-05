import { Button, ButtonProps } from '@trezor/components';
import { Translation } from 'src/components/suite';

export const OnboardingButtonBack = (props: ButtonProps) => (
    <Button
        data-test="@onboarding/back-button"
        variant="tertiary"
        icon="ARROW_LEFT"
        {...props}
        style={{ backgroundColor: 'initial' }}
    >
        <Translation id="TR_BACK" />
    </Button>
);
