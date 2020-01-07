import React from 'react';
import styled from 'styled-components';
import { Icon, P } from '@trezor/components';

import colors from '@onboarding-config/colors';

const DonutWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
`;

const DonutContent = styled.div`
    position: absolute;
`;

interface DonutProps {
    progress?: number;
    radius?: number;
    stroke?: number;
    isError?: boolean;
    isSuccess?: boolean;
}

const Donut = (props: DonutProps) => {
    const { radius = 60, stroke = 20, progress = 0, isError = false, isSuccess = false } = props;
    const circumference = (radius: number) => radius * 2 * Math.PI;
    const normalizeRadius = () => radius - stroke;

    const getVisualProgress = (percent: number) =>
        circumference(normalizeRadius()) - (percent / 100) * circumference(normalizeRadius());

    const style = {
        transition: 'stroke-dasharray 2.5s, stroke-dashoffset 2.5s',
        transform: 'rotate(-90deg)',
        transformOrigin: '50% 50%',
        strokeDashoffset: `${getVisualProgress(progress)}`,
        strokeDasharray: `${circumference(normalizeRadius())}  ${circumference(normalizeRadius())}`,
    };

    const getProgressColor = () => {
        if (isError) {
            return colors.error;
        }
        return colors.brandPrimary;
    };

    const getBaseColor = () => {
        if (isError) {
            return colors.error;
        }
        if (isSuccess) {
            return colors.brandPrimary;
        }
        return colors.grayLight;
    };

    return (
        <DonutWrapper>
            <svg height={radius * 2} width={radius * 2} style={{ position: 'absolute', zIndex: 1 }}>
                <circle
                    style={{
                        ...style,
                    }}
                    stroke={getProgressColor()}
                    strokeWidth={stroke}
                    fill="transparent"
                    r={radius - stroke}
                    cx={radius}
                    cy={radius}
                />
            </svg>
            <svg height={radius * 2} width={radius * 2} style={{ position: 'relative' }}>
                <circle
                    style={{
                        ...style,
                        strokeDashoffset: `${getVisualProgress(100)}`,
                        strokeDasharray: `${circumference(normalizeRadius())}  ${circumference(
                            normalizeRadius(),
                        )}`,
                    }}
                    stroke={getBaseColor()}
                    strokeWidth={stroke}
                    fill="transparent"
                    r={radius - stroke}
                    cx={radius}
                    cy={radius}
                />
            </svg>
            <DonutContent>
                {isSuccess && <Icon icon="SUCCESS" size={stroke} color={colors.brandPrimary} />}
                {isError && <Icon icon="ERROR" size={stroke} color={colors.error} />}
                {!isError && !isSuccess && progress > 0 && <P>{progress} %</P>}
            </DonutContent>
        </DonutWrapper>
    );
};

export default Donut;
