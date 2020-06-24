import React from 'react';
import styled from 'styled-components';
import { variables, Icon, colors } from '@trezor/components';

const Wrapper = styled.div`
    position: relative;
`;

const StyledInput = styled.input`
    letter-spacing: 7px;
    width: 100%;
    height: 53px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    font-size: ${variables.FONT_SIZE.H2};
    padding: 0 31px 0 20px;
    color: ${colors.BLACK25};
    background: transparent;
    border-radius: 3px;
    box-shadow: inset 0 3px 6px 0 ${colors.BLACK92};
    border: solid 1px #cccccc;
    box-sizing: border-box;
`;

const StyledIcon = styled(Icon)`
    position: absolute;
    top: 14px;
    right: 15px;
    cursor: pointer;
`;

// TODO: proper types for wrapperProps (should be same as React.HTMLAttributes<HTMLDivElement>)
interface Props {
    value: string;
    wrapperProps?: Record<string, any>;
    onDeleteClick: (event?: React.MouseEvent<any>) => void;
}

const InputPin = ({ value, onDeleteClick, wrapperProps, ...rest }: Props) => (
    <Wrapper {...rest} {...wrapperProps}>
        <StyledInput disabled type="password" maxLength={9} autoComplete="off" value={value} />
        <StyledIcon onClick={onDeleteClick} color={colors.BLACK25} icon="BACK" />
    </Wrapper>
);

export default InputPin;
