/* @flow */

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import colors from 'config/colors';
import Icon from 'components/Icon';
import { FONT_SIZE, FONT_WEIGHT } from 'config/variables';
import icons from 'config/icons';

type Props = {
    value: string;
    onDeleteClick: () => void;
};

const Wrapper = styled.div`
    position: relative;
`;

const StyledInput = styled.input`
    letter-spacing: 7px;
    width: 100%;
    font-weight: ${FONT_WEIGHT.SEMIBOLD};
    font-size: ${FONT_SIZE.BIGGEST};
    padding: 5px 31px 10px 20px;
    color: ${colors.TEXT_PRIMARY};
    background: transparent;
    border: 1px solid ${colors.DIVIDER};
`;

const StyledIcon = styled(Icon)`
    position: absolute;
    top: 10px;
    right: 15px;
    cursor: pointer;
`;

const Input = ({ value, onDeleteClick }: Props) => (
    <Wrapper>
        <StyledInput
            disabled
            type="password"
            maxLength="9"
            autoComplete="off"
            value={value}
        />
        <StyledIcon onClick={onDeleteClick} color={colors.TEXT_PRIMARY} icon={icons.BACK} />
    </Wrapper>
);

Input.propTypes = {
    onDeleteClick: PropTypes.func.isRequired,
    value: PropTypes.string.isRequired,
};

export default Input;
