import styled, { useTheme } from 'styled-components';

import { CSSColor } from '@trezor/theme';

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
    max-width: 100%;
    width: ${({ $max, $value }) => `calc((100% / ${$max}) * ${$value})`};
    transition: width 0.5s;
`;

export type ProgressBarProps = {
    max?: number;
    value: number;
    backgroundColor?: CSSColor;
    foregroundColor?: CSSColor;
    'data-testid'?: string;
    /**
     *  @deprecated Legacy prop - do not add non-standard properties
     */
    className?: string;
};

export const ProgressBar = ({
    max = 100,
    value,
    backgroundColor,
    foregroundColor,
    className,
    'data-testid': dataTestId,
}: ProgressBarProps) => {
    const theme = useTheme();

    return (
        <Wrapper
            $color={backgroundColor || theme.backgroundNeutralSubdued}
            data-testid={dataTestId}
            className={className}
        >
            <Value $max={max} $value={value} $color={foregroundColor || theme.iconPrimaryDefault} />
        </Wrapper>
    );
};

ProgressBar.Value = Value;
