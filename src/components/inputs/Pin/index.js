import { FONT_SIZE, FONT_WEIGHT } from 'config/variables';

import Icon from 'components/Icon';
import PropTypes from 'prop-types';
import React from 'react';
import colors from 'config/colors';
import icons from 'config/icons';
import styled from 'styled-components';

const Wrapper = styled.div`
    position: relative;
`;

const StyledInput = styled.input`
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

const InputPin = ({ value, onDeleteClick, ...rest }) => (
    <Wrapper {...rest}>
        <StyledInput disabled type="password" maxLength="9" autoComplete="off" value={value} />
        <StyledIcon onClick={onDeleteClick} color={colors.TEXT_PRIMARY} icon={icons.BACK} />
    </Wrapper>
);

InputPin.propTypes = {
    onDeleteClick: PropTypes.func.isRequired,
    value: PropTypes.string.isRequired,
};

export default InputPin;
