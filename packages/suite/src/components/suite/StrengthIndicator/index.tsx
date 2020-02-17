import React from 'react';
import styled from 'styled-components';
import { colors } from '@trezor/components-v2';

interface WrapperProps {
    width?: number;
}

const Wrapper = styled.div<WrapperProps>`
    display: flex;
    margin: 8px 0;
    flex: 1;
    height: 5px;
    overflow: hidden;
    border-radius: 5px;
    width: ${props => (props.width ? `${props.width}px` : '100%')};
`;

interface LineProps {
    width?: number;
    isFilled: boolean;
}

const Line = styled.div<LineProps>`
    background: ${props => (props.color && props.isFilled ? props.color : 'transparent')};
    display: flex;
    flex: 1;
    height: 5px;
    transition: all 0.5s;
`;

const getColor = (score?: zxcvbn.ZXCVBNResult['score']) => {
    switch (score) {
        case 0:
        case 1:
            return colors.RED;
        case 2:
            return colors.YELLOW;
        case 3:
        case 4:
            return colors.GREEN;
        default:
            return 'transparent';
    }
};

interface Props {
    score?: zxcvbn.ZXCVBNResult['score'];
}

export default ({ score }: Props) => {
    return (
        <Wrapper>
            {[...Array(5)].map((_x, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <Line key={i} isFilled={score ? i <= score : false} color={getColor(score)} />
            ))}
        </Wrapper>
    );
};
