import React from 'react';
import styled from 'styled-components';
import { variables, useTheme, Icon, Input } from '@trezor/components';

const StyledInput = styled(Input)`
    letter-spacing: 8px;
    min-width: 256px;
    height: 54px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    font-size: ${variables.FONT_SIZE.SMALL};
    padding: 0 32px 0 20px;
    color: ${props => props.theme.TYPE_DARK_GREY};
    background: transparent;
    border-radius: 4px;
    box-shadow: inset 0 3px 6px 0 ${props => props.theme.BG_GREY};
    border: solid 1px #cccccc;
    box-sizing: border-box;
`;

interface Props {
    value: string;
    onDeleteClick: (event?: React.MouseEvent<any>) => void;
}

const InputPin = ({ value, onDeleteClick }: Props) => {
    const theme = useTheme();

    return (
        <StyledInput
            disabled
            noTopLabel
            noError
            value={value.replace(/[0-9]/g, '●')}
            innerAddon={<Icon onClick={onDeleteClick} color={theme.TYPE_DARK_GREY} icon="BACK" />}
        />
    );
};

export default InputPin;
