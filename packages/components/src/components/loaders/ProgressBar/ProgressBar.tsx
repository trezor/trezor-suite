import styled, { useTheme } from 'styled-components';

import { type CSSColor } from '@trezor/theme';

const Wrapper = styled.div<{ $color: CSSColor }>`
    background: ${({ $color }) => $color};
    width: 100%;
    overflow: hidden;
`;

type ValueProps = {
    $max: number;
    $value: number;
    $color: CSSColor;
};

const Value = styled.div<ValueProps>`
    background: ${({ $color }) => $color};
    height: 5px;
    width: 100%;
    transform-origin: left;
    transform: scaleX(${({ $max, $value }) => Math.min($value / ($max || 1), 1)});
    transition: transform 0.5s;
`;

export type ProgressBarProps = {
    max?: number;
    value: number;
    backgroundColor?: CSSColor;
    foregroundColor?: CSSColor;
    'data-testid'?: string;
};

export const ProgressBar = ({
    max = 100,
    value,
    backgroundColor,
    foregroundColor,
    'data-testid': dataTestId,
}: ProgressBarProps) => {
    const theme = useTheme();

    return (
        <Wrapper
            $color={backgroundColor || theme.elementFillNeutralBold}
            data-component="ProgressBar"
            data-testid={dataTestId}
        >
            <Value $max={max} $value={value} $color={foregroundColor || theme.contentBrand} />
        </Wrapper>
    );
};

ProgressBar.Value = Value;
