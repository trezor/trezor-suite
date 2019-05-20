import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/native';

import { FONT_SIZE_NATIVE as FONT_SIZE, FONT_WEIGHT } from '../../../config/variables';
import Icon from '../../Icon';
import colors from '../../../config/colors';
import icons from '../../../config/icons';

const Wrapper = styled.View`
    position: relative;
`;

const StyledInput = styled.TextInput`
    letter-spacing: 7px;
    width: 100%;
    height: 53px;
    font-weight: ${FONT_WEIGHT.SEMIBOLD};
    font-size: ${FONT_SIZE.BIGGEST};
    padding: 5px 31px 10px 20px;
    color: ${colors.TEXT_PRIMARY};
    background: transparent;
    border: 1px solid ${colors.DIVIDER};
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
        <StyledInput secureTextEntry={true} maxLength={9} value={value} />
        <StyledIcon onClick={onDeleteClick} color={colors.TEXT_PRIMARY} icon={icons.BACK} />
    </Wrapper>
);

InputPin.propTypes = {
    onDeleteClick: PropTypes.func.isRequired,
    value: PropTypes.string.isRequired,
};

export default InputPin;
