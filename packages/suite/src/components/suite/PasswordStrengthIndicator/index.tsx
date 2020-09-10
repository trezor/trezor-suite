import React from 'react';
import styled from 'styled-components';
import zxcvbn from 'zxcvbn';
import { colors } from '@trezor/components';

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

const getColor = (score: 0 | 1 | 2 | 3 | 4, password: string) => {
    if (password === '') return 'transparent';
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
    password: string;
}

const PasswordStrengthIndicator = ({ password }: Props) => {
    const passwordInfo = zxcvbn(password);
    const { score } = passwordInfo;
    return (
        <Wrapper>
            {[...Array(5)].map((_x, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <Line key={i} isFilled={i <= score} color={getColor(score, password)} />
            ))}
        </Wrapper>
    );
};

export default PasswordStrengthIndicator;
