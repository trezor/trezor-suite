import React from 'react';
import styled from 'styled-components/native';
import PropTypes from 'prop-types';
import colors from '../../../config/colors';

const Touchable = styled.TouchableHighlight`
    width: 80px;
    height: 80px;
    border: 1px solid ${colors.DIVIDER};
    background: ${colors.WHITE};
    position: relative;
`;

const Dot = styled.View`
    width: 6px;
    height: 6px;
    position: absolute;
    border-radius: 6px;
    background: ${colors.TEXT_PRIMARY};
    top: 37px;
    left: 37px;
`;

interface Props {
    onClick: () => void;
}

const ButtonPin = ({ onClick }: Props) => {
    return (
        <Touchable onPress={onClick} underlayColor={colors.DIVIDER} activeOpacity={0.5}>
            <Dot />
        </Touchable>
    );
};

ButtonPin.propTypes = {
    onClick: PropTypes.func,
};

export default ButtonPin;
