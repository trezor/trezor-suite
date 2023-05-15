import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import styled, { css, CSSObject } from 'styled-components';

import { useTheme, variables } from '@trezor/components';

const track = css<Pick<RangeProps, 'trackStyle'>>`
    background: ${({ theme }) => theme.BG_GREEN};
    height: 3px;

    ${({ trackStyle }) => trackStyle}
`;

const thumb = css<Pick<RangeProps, 'disabled' | 'thumbStyle'>>`
    appearance: none;
    background: ${({ theme }) => theme.TYPE_WHITE};
    border-radius: 50%;
    box-shadow: 0 0 2px 2px ${({ theme }) => theme.BOX_SHADOW_RANGE};
    cursor: ${({ disabled }) => !disabled && 'grab'};
    height: 26px;
    margin-top: -12px;
    width: 26px;

    ${({ disabled }) =>
        !disabled &&
        css`
            :active {
                box-shadow: 0 0 1px 1px ${({ theme }) => theme.BOX_SHADOW_RANGE};
                cursor: grabbing;
            }
        `}

    ${({ thumbStyle }) => thumbStyle}
`;

const largeBoxShadow = css`
    box-shadow: 0 0 3px 3px ${({ theme }) => theme.BOX_SHADOW_RANGE};
`;

const Input = styled.input<Pick<RangeProps, 'disabled' | 'thumbStyle' | 'trackStyle'>>`
    margin-top: 16px;
    padding: 14px 0;
    width: 100%;
    vertical-align: top; /* prevent extra bottom space in Firefox */
    background: none;
    appearance: none;
    cursor: ${({ disabled }) => !disabled && 'pointer'};

    ::-webkit-slider-runnable-track {
        ${track};
    }

    ::-webkit-slider-thumb {
        ${thumb};
    }

    ::-moz-range-track {
        ${track}
    }

    ::-moz-range-thumb {
        ${thumb};
    }

    :focus-visible {
        ::-webkit-slider-thumb {
            ${largeBoxShadow};
        }

        ::-moz-range-thumb {
            ${largeBoxShadow};
        }
    }
`;

const Label = styled.div<{ disabled?: boolean; $width?: number }>`
    position: relative;
    justify-self: center;
    padding-top: 2px;
    min-width: ${({ $width }) => `${$width}px`};
    text-align: center;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    opacity: 0.5;
    cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};

    :first-child {
        text-align: left;
    }
`;

const LabelsWrapper = styled.div<{ count: number; $width?: number }>`
    display: grid;
    grid-template-columns: ${({ count, $width }) =>
        `repeat(${count}, ${$width ? `${$width}px` : '1fr'})`};
    justify-content: space-between;
`;

export interface RangeProps {
    className?: string;
    disabled?: boolean;
    labels?: Array<{ value: string | number; component?: React.ReactNode }>;
    max?: number;
    min?: number;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    onKeyDown?: React.KeyboardEventHandler;
    onLabelClick?: (value: number) => void;
    step?: string;
    thumbStyle?: CSSObject;
    trackStyle?: CSSObject;
    value: number;
}

export const Range = ({
    className,
    disabled,
    labels,
    onLabelClick,
    trackStyle,
    ...props
}: RangeProps) => {
    const [labelsElWidth, setLabelsElWidth] = useState<number>();

    const lastLabelRef = useRef<HTMLParagraphElement>(null);

    const theme = useTheme();

    const disabledTrackStyle = { background: theme.STROKE_GREY };

    const handleLabelClick: RangeProps['onLabelClick'] = value => {
        if (disabled || !onLabelClick) return;
        onLabelClick(value);
    };

    useLayoutEffect(() => {
        if (!lastLabelRef.current) return;
        setLabelsElWidth(lastLabelRef.current?.getBoundingClientRect().width);
    }, [lastLabelRef, setLabelsElWidth]);

    const labelComponents = labels?.map(({ value, component }, i) => {
        const isLastElement = i === labels.length - 1;

        return (
            <Label
                key={value}
                disabled={disabled}
                $width={labelsElWidth}
                onClick={() => handleLabelClick?.(Number.parseFloat(String(value)))}
                ref={isLastElement ? lastLabelRef : undefined}
            >
                {component || value}
            </Label>
        );
    });

    return (
        <div className={className}>
            <Input
                {...props}
                type="range"
                disabled={disabled}
                trackStyle={disabled ? disabledTrackStyle : trackStyle}
            />
            {labels?.length && (
                <LabelsWrapper count={labels.length} $width={labelsElWidth}>
                    {labelComponents}
                </LabelsWrapper>
            )}
        </div>
    );
};
