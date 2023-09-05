import styled from 'styled-components';
import { Button, ButtonProps } from '@trezor/components';

const StyledButton = styled(Button)`
    min-width: 180px;
`;

export const OnboardingButtonCta = (props: ButtonProps) => (
    <StyledButton {...props}>{props.children}</StyledButton>
);
