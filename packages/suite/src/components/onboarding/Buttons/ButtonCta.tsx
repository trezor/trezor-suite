import styled from 'styled-components';
import { Button, ButtonProps } from '@trezor/components';

const StyledButton = styled(Button)`
    min-width: 180px;
`;

const ButtonCta = (props: ButtonProps) => <StyledButton {...props}>{props.children}</StyledButton>;

export default ButtonCta;
