import React from 'react';
import styled from 'styled-components/native';
import { TouchableHighlightProps, GestureResponderEvent } from 'react-native';
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

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Props extends TouchableHighlightProps {
    onClick: (event: GestureResponderEvent) => void;
}

const ButtonPin = ({ onClick }: Props) => {
    return (
        <Touchable onPress={onClick} underlayColor={colors.DIVIDER} activeOpacity={0.5}>
            <Dot />
        </Touchable>
    );
};

export { ButtonPin, Props as ButtonPinProps };
