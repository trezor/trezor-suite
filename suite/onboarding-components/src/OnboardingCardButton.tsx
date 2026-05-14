import { Button, type ButtonProps } from '@trezor/components';

export const OnboardingCardButton = (props: ButtonProps) => (
    <Button size="large" minWidth={180} {...props} />
);
