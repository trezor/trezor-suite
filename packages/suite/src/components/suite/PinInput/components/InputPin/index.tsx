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
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    background: transparent;
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
            innerAddon={
                <Icon
                    onClick={onDeleteClick}
                    color={!value ? theme.TYPE_LIGHT_GREY : theme.TYPE_DARK_GREY}
                    icon="BACK"
                />
            }
        />
    );
};

export default InputPin;
