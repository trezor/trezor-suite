import styled, { css } from 'styled-components';

import { borders, spacingsPx, typography } from '@trezor/theme';

const DEFAULT_SEGMENT = { max: 0, name: '' };

const thumb = css<{ disabled?: boolean }>`
    appearance: none;
    background: white;
    border-radius: ${borders.radii.full};
    box-shadow: 0 0 4px 0 rgb(0 0 0 / 50%);
    margin-top: calc((${spacingsPx.xxs} - ${spacingsPx.xl}) / 2);
    width: ${spacingsPx.xl};
    height: ${spacingsPx.xl};
    cursor: ${({ disabled }) => !disabled && 'grab'};

    ${({ disabled }) =>
        !disabled &&
        css`
            &:active {
                box-shadow: 0 0 2px 0 rgb(0 0 0 / 50%);
                cursor: grabbing;
            }
        `}
`;

const StyledSegmentSlider = styled.div`
    width: 100%;
    position: relative;
`;

const SegmentInput = styled.input<{ disabled?: boolean }>`
    margin: ${spacingsPx.sm} 0 ${spacingsPx.xs};
    padding: 10px 0;
    width: 100%;
    vertical-align: top; /* prevent extra bottom space in Firefox */

    position: relative;
    z-index: 10;

    width: 100%;

    background: none;
    appearance: none;
    cursor: ${({ disabled }) => !disabled && 'pointer'};

    &::-webkit-slider-runnable-track {
        appearance: none;
        background: transparent;
    }

    &::-webkit-slider-thumb {
        ${thumb};
    }

    &::-moz-range-track {
        appearance: none;
        background: transparent;
    }

    &::-moz-range-thumb {
        ${thumb};
        transform: translateY(-6px); /* Firefox hack because of position absolute */
    }

    &:disabled {
        pointer-events: auto;
        cursor: not-allowed;
    }
`;

const Segments = styled.div`
    position: absolute;
    top: 0;

    margin: ${spacingsPx.sm} 0 ${spacingsPx.xs};
    padding: 10px 0;
    width: 100%;
`;

const Segment = styled.div<{ $start: number; $end: number }>`
    --segment-padding: 2px;

    position: absolute;
    left: ${({ $start }) => $start}%;
    width: calc(${({ $start, $end }) => $end - $start}% - var(--segment-padding) * 2);
`;

const SegmentLine = styled.div<{ $filled: number; disabled?: boolean }>`
    height: ${spacingsPx.xxs};
    background: ${({ $filled, theme, disabled }) =>
        `linear-gradient(90deg, ${disabled ? theme.backgroundNeutralDisabled : theme.backgroundPrimaryDefault} ${$filled}%, ${disabled ? theme.backgroundNeutralDisabled : theme.backgroundNeutralSubdued} ${$filled}%)`};

    border-radius: ${borders.radii.full};
`;

const SegmentLabel = styled.div`
    margin-top: ${spacingsPx.sm};
    padding-top: ${spacingsPx.xxxs};
    text-align: left;
    color: ${({ theme }) => theme.textSubdued};
    ${typography.label}

    span {
        cursor: pointer;
    }
`;

type Segment = {
    max: number;
    name: string;
};

const normalizeValue = (value: number, min: number, max: number) =>
    ((value - min) / (max - min)) * 100;

const getPreviousSegment = (segments: Segment[], index: number): Segment => {
    if (index <= 0) return DEFAULT_SEGMENT;
    return segments.at(index - 1) ?? DEFAULT_SEGMENT;
};

const getProgress = (
    value: number,
    segment: Segment,
    previousSegment: Segment,
    sliderMin: number,
    sliderMax: number,
): number => {
    const isActive = value <= segment.max && value > previousSegment.max;
    const normalizedPreviousMax = normalizeValue(previousSegment.max, sliderMin, sliderMax);
    const normalizedSegmentMax = normalizeValue(segment.max, sliderMin, sliderMax);
    return isActive
        ? ((normalizeValue(value, sliderMin, sliderMax) - normalizedPreviousMax) /
              (normalizedSegmentMax - normalizedPreviousMax)) *
              100
        : value > segment.max
          ? 100
          : 0;
};

type SegmentItemProps = {
    disabled?: boolean;
    segments: Segment[];
    segment: Segment;
    index: number;
    value: number;
    sliderMin: number;
    sliderMax: number;
    handleForceChange: (value: number) => void;
};

const SegmentItem = ({
    disabled,
    segments,
    segment,
    index,
    value,
    sliderMin,
    sliderMax,
    handleForceChange,
}: SegmentItemProps) => {
    const previousSegment = getPreviousSegment(segments, index);
    const progress = getProgress(value, segment, previousSegment, sliderMin, sliderMax);
    const normalizedPreviousMax = normalizeValue(previousSegment.max, sliderMin, sliderMax);
    const normalizedSegmentMax = normalizeValue(segment.max, sliderMin, sliderMax);

    return (
        <Segment
            key={`${index}_${segment.name}`}
            $start={normalizedPreviousMax}
            $end={normalizedSegmentMax}
        >
            <SegmentLine $filled={progress} disabled={disabled} />
            <SegmentLabel>
                <span
                    onClick={() => handleForceChange(segment.max)}
                    onKeyUp={e => e.key === 'Enter' && handleForceChange(segment.max)}
                >
                    {segment.name}
                </span>
            </SegmentLabel>
        </Segment>
    );
};

export interface SegmentSliderProps {
    className?: string;
    disabled?: boolean;
    segments: Array<{ max: number; name: string }>;
    onChange: (value: number) => void;
    onLabelClick?: (value: number) => void;
    value: number;
}

export const SegmentSlider = ({
    className,
    disabled,
    segments,
    onChange,
    onLabelClick,
    value,
}: SegmentSliderProps) => {
    const sliderMin = 0;
    const sliderMax = segments.at(-1)?.max ?? 100;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onChange(Number(event.target.value));
    };

    const handleLabelClick = (value: number) => {
        if (disabled || !onLabelClick) return;
        onLabelClick(value);
    };

    return (
        <StyledSegmentSlider className={className}>
            <SegmentInput
                type="range"
                disabled={disabled}
                min={sliderMin}
                max={sliderMax}
                value={value}
                onChange={handleChange}
            />
            <Segments>
                {segments.map((segment, index) => (
                    <SegmentItem
                        key={`${index}_${segment.name}`}
                        disabled={disabled}
                        segments={segments}
                        segment={segment}
                        index={index}
                        value={value}
                        sliderMin={sliderMin}
                        sliderMax={sliderMax}
                        handleForceChange={handleLabelClick}
                    />
                ))}
            </Segments>
        </StyledSegmentSlider>
    );
};
