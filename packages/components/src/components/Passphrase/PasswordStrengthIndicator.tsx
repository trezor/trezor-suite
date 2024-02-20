import { useState, useEffect } from 'react';
import styled from 'styled-components';

import type { ZXCVBNScore } from 'zxcvbn';
import { colors } from '../../config';

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

type OptionalZXCVBNScore = ZXCVBNScore | undefined;

const getColor = (score: OptionalZXCVBNScore, password: string) => {
    if (password === '' || Number.isNaN(score)) return 'transparent';
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

const getPasswordScore = async (password: string) => {
    const zxcvbn = await import(/* webpackChunkName: "zxcvbn" */ 'zxcvbn');

    return zxcvbn.default(password).score;
};

interface PasswordStrengthIndicatorProps {
    password: string;
}

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
    const [score, setScore] = useState<OptionalZXCVBNScore>();
    useEffect(() => {
        const runScoring = async () => {
            try {
                const pwScore = await getPasswordScore(password);
                setScore(pwScore);
            } catch (error) {
                console.error(error);
            }
        };

        if (password) {
            runScoring();
        }
    }, [password]);

    return (
        <Wrapper>
            {[...Array(5)].map((_x, i) => (
                <Line
                    key={i}
                    isFilled={score !== undefined && i <= score}
                    color={getColor(score, password)}
                />
            ))}
        </Wrapper>
    );
};
