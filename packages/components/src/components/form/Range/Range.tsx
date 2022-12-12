import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import styled, { css, CSSObject } from 'styled-components';
import { variables } from '@trezor/components';

const track = css`
    background: ${({ theme }) => theme.BG_GREEN};
    height: 3px;
`;

const thumb = css`
    appearance: none;
    background: ${({ theme }) => theme.TYPE_WHITE};
    border-radius: 50%;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.5);
    cursor: grab;
    height: 26px;
    margin-top: -12px;
    width: 26px;

    :active {
        box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.5);
        cursor: grabbing;
    }
`;

const Input = styled.input<Pick<RangeProps, 'thumbStyle' | 'trackStyle'>>`
    margin-top: 16px;
    padding: 14px 0;
    width: 100%;
    vertical-align: top; /* prevent extra bottom space in Firefox */
    background: none;
    appearance: none;
    cursor: pointer;

    ::-webkit-slider-runnable-track {
        ${track};
        ${({ trackStyle }) => trackStyle}
    }
    ::-webkit-slider-thumb {
        ${thumb}
        ${({ thumbStyle }) => thumbStyle}
    }
    ::-moz-range-track {
        ${track}
        ${({ trackStyle }) => trackStyle}
    }
    ::-moz-range-thumb {
        ${thumb}
        ${({ thumbStyle }) => thumbStyle}
    }
`;

const LabelsWrapper = styled.div<{ count: number; $width?: number }>`
    display: grid;
    grid-template-columns: ${({ count, $width }) =>
        count && $width && `repeat(${count}, ${$width}px)`};
    justify-content: space-between;
`;

const Label = styled.div<{ $width?: number }>`
    position: relative;
    justify-self: center;
    padding-top: 2px;
    min-width: ${({ $width }) => `${$width}px`};
    text-align: center;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    opacity: 0.5;
    cursor: pointer;
`;

export interface RangeProps {
    className?: string;
    max?: number;
    min?: number;
    step?: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    thumbStyle?: CSSObject;
    trackStyle?: CSSObject;
    value: number;
    labels?: (string | number)[];
    onLabelClick?: (value: number) => void;
}

export const Range = ({ labels, onLabelClick, className, ...props }: RangeProps) => {
    const [labelsElWidth, setLabelsElWidth] = useState<number>();

    const lastLabelRef = useRef<HTMLParagraphElement>(null);

    useLayoutEffect(() => {
        if (!lastLabelRef.current) {
            return;
        }

        setLabelsElWidth(lastLabelRef.current?.getBoundingClientRect().width);
    }, [lastLabelRef, setLabelsElWidth]);

    const labelComponents = useMemo(
        () =>
            labels?.map((label, i) => {
                const isLastElement = i === labels.length - 1;

                return (
                    <Label
                        key={label}
                        $width={labelsElWidth}
                        onClick={() => onLabelClick?.(Number.parseFloat(String(label)))}
                        ref={isLastElement ? lastLabelRef : undefined}
                    >
                        {label}
                    </Label>
                );
            }),
        [labels, onLabelClick, lastLabelRef, labelsElWidth],
    );

    return (
        <div className={className}>
            <Input type="range" {...props} />
            {labels?.length && (
                <LabelsWrapper count={labels.length} $width={labelsElWidth}>
                    {labelComponents}
                </LabelsWrapper>
            )}
        </div>
    );
};
