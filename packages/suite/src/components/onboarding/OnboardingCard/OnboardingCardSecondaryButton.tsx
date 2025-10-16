import { NewButton, NewButtonProps } from '@trezor/components';

export const OnboardingCardSecondaryButton = ({ children, ...rest }: NewButtonProps) => (
    <NewButton size="small" intent="neutral" priority="secondary" {...rest}>
        {children}
    </NewButton>
);
