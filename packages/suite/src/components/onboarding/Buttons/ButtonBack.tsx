import { Button, ButtonProps } from '@trezor/components';

const ButtonBack = (props: ButtonProps) => (
    <Button
        data-test="@onboarding/back-button"
        variant="tertiary"
        icon="ARROW_LEFT"
        {...props}
        style={{ backgroundColor: 'initial' }}
    >
        {props.children}
    </Button>
);

export default ButtonBack;
