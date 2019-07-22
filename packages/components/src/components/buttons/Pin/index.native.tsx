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
    align-items: center;
    justify-content: center;
`;

const Dot = styled.View`
    width: 6px;
    height: 6px;
    border-radius: 6px;
    background: ${colors.TEXT_PRIMARY};
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
