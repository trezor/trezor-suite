import React from 'react';
import styled from 'styled-components';
import { Button, ButtonProps } from '@trezor/components';

const StyledButton = styled(Button)`
    min-width: 180px;
`;
interface Props extends ButtonProps {
    isDisabled?: boolean;
}

const ButtonCta = (props: Props) => <StyledButton {...props}>{props.children}</StyledButton>;

export default ButtonCta;
