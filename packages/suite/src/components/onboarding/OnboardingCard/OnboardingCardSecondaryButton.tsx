import { Button, ButtonProps } from '@trezor/components';

export const OnboardingCardSecondaryButton = (props: ButtonProps) => (
    <Button size="small" variant="tertiary" {...props}>
        {props.children}
    </Button>
);
