import { NewButton, NewButtonProps } from '@trezor/components';

export const OnboardingCardButton = (props: NewButtonProps) => (
    <NewButton size="large" minWidth={180} {...props} />
);
