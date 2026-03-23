import { Button, type ButtonProps } from '@trezor/components';

export const OnboardingCardSecondaryButton = ({ children, ...rest }: ButtonProps) => (
    <Button size="small" intent="neutral" priority="secondary" {...rest}>
        {children}
    </Button>
);
