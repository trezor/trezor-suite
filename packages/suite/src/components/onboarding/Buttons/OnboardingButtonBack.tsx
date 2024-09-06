import { Button, ButtonProps } from '@trezor/components';
import { Translation } from 'src/components/suite';

export const OnboardingButtonBack = (props: Omit<ButtonProps, 'children'>) => (
    <Button
        data-testid="@onboarding/back-button"
        variant="tertiary"
        size="small"
        icon="caretLeft"
        {...props}
    >
        <Translation id="TR_BACK" />
    </Button>
);
