import React from 'react';
import styled from 'styled-components';
import zxcvbn from 'zxcvbn';
import { colors } from '@trezor/components-v2';

interface WrapperProps {
    width?: number;
}

const Wrapper = styled.div<WrapperProps>`
    display: flex;
    padding: 8px 0;
    width: ${props => (props.width ? `${props.width}px` : '100%')};
`;

interface LineProps {
    width?: number;
    isFilled: boolean;
}

const Line = styled.div<LineProps>`
    background: ${props => (props.color && props.isFilled ? props.color : 'transparent')};
    flex: 1;
    height: 5px;
    margin-right: 5px;
    border-radius: 5px;

    &:last-child {
        margin-right: 0;
    }
`;

interface Props {
    password: string;
}

const getColor = (score: 0 | 1 | 2 | 3 | 4 | 5) => {
    switch (score) {
        case 0:
        case 1:
            return colors.RED;
        case 2:
        case 3:
            return colors.YELLOW;
        case 4:
        case 5:
            return colors.GREEN;
        default:
            return colors.BLACK0;
    }
};

export default ({ password }: Props) => {
    const passwordInfo = zxcvbn(password);
    const { score } = passwordInfo;
    return (
        <Wrapper>
            {[...Array(5)].map((_x, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <Line key={i} isFilled={i <= score} color={getColor(score)} />
            ))}
        </Wrapper>
    );
};
