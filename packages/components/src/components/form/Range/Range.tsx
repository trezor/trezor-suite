import React from 'react';
import styled, { css, CSSObject } from 'styled-components';

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

type RangeProps = {
    className?: string;
    max?: number;
    min?: number;
    step?: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    thumbStyle?: CSSObject;
    trackStyle?: CSSObject;
    value: number;
};

const Input = styled.input<Pick<RangeProps, 'thumbStyle' | 'trackStyle'>>`
    appearance: none;
    margin-top: 16px;
    padding: 14px 0;
    vertical-align: top; /* prevent extra bottom space in Firefox */
    width: 100%;
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

export const Range = (props: RangeProps) => <Input type="range" {...props} />;
