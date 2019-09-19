import React from 'react';
import styled from 'styled-components/native';

import { FONT_SIZE_NATIVE as FONT_SIZE, FONT_WEIGHT } from '../../../config/variables';
import { Icon } from '../../Icon';
import colors from '../../../config/colors';

const Wrapper = styled.View`
    position: relative;
`;

const StyledInput = styled.TextInput`
    letter-spacing: 7;
    width: 100%;
    height: 53;
    font-weight: ${FONT_WEIGHT.SEMIBOLD};
    font-size: ${FONT_SIZE.BIGGEST};
    padding: 0 5px 0 20px;
    color: ${colors.TEXT_PRIMARY};
    background: transparent;
    border: 1px solid ${colors.DIVIDER};
`;

const IconWrapper = styled.View`
    position: absolute;
    top: 14;
    right: 15;
`;

interface Props {
    value: string;
    wrapperProps?: Record<string, any>;
    onDeleteClick: (event?: React.MouseEvent<any>) => void;
}

const InputPin = ({ value, onDeleteClick, wrapperProps, ...rest }: Props) => (
    <Wrapper {...rest} {...wrapperProps}>
        <StyledInput secureTextEntry maxLength={9} value={value} editable={false} />
        <IconWrapper>
            <Icon onClick={onDeleteClick} color={colors.TEXT_PRIMARY} icon="BACK" />
        </IconWrapper>
    </Wrapper>
);

export { InputPin, Props as InputPinProps };
