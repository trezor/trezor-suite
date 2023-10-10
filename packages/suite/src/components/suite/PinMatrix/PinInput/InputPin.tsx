import { MouseEvent } from 'react';
import styled, { useTheme } from 'styled-components';
import { variables, Icon, Input } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';

const StyledInput = styled(Input)`
    input {
        letter-spacing: ${spacingsPx.xs};
        min-width: 256px;
        height: 54px;
        font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
        font-size: ${variables.FONT_SIZE.SMALL};
        padding: 0 ${spacingsPx.md} 0 ${spacingsPx.lg};
        color: ${({ theme }) => theme.TYPE_DARK_GREY};
        background: transparent;
        box-sizing: border-box;
    }
`;

interface InputPinProps {
    value: string;
    onDeleteClick: (event?: MouseEvent<any>) => void;
}

export const InputPin = ({ value, onDeleteClick }: InputPinProps) => {
    const theme = useTheme();

    return (
        <StyledInput
            isDisabled
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
