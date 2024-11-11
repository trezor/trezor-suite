import {
    useLayoutEffect,
    useRef,
    useState,
    ReactNode,
    KeyboardEventHandler,
    ChangeEventHandler,
    useCallback,
} from 'react';

import styled, { css, CSSObject, DefaultTheme } from 'styled-components';

import { borders, spacingsPx, typography } from '@trezor/theme';

type RangeMode = 'normal' | 'segments';

type Segment = {
    max: number;
    value: string | number;
    component?: ReactNode;
};

const DEFAULT_SEGMENT: Segment = { max: 0, value: '' };

const normalizeValue = (value: number, min: number, max: number) =>
    ((value - min) / (max - min)) * 100;

const getProgress = (
    value: number,
    max: number,
    previousMax: number,
    sliderMin: number,
    sliderMax: number,
): number => {
    const isActive = value <= max && value > previousMax;
    const normalizedPreviousMax = normalizeValue(previousMax, sliderMin, sliderMax);
    const normalizedSegmentMax = normalizeValue(max, sliderMin, sliderMax);

    if (isActive) {
        const normalizedValue = normalizeValue(value, sliderMin, sliderMax);
        const progress =
            ((normalizedValue - normalizedPreviousMax) /
                (normalizedSegmentMax - normalizedPreviousMax)) *
            100;

        return progress;
    } else {
        return value > max ? 100 : 0;
    }
};

const getLinearGradient = (progress: number, theme: DefaultTheme, disabled?: boolean): string => {
    const primaryColor = disabled
        ? theme.backgroundNeutralDisabled
        : theme.backgroundPrimaryDefault;
    const secondaryColor = disabled
        ? theme.backgroundNeutralDisabled
        : theme.backgroundNeutralSubdued;

    return `linear-gradient(90deg, ${primaryColor} ${progress}%, ${secondaryColor} ${progress}%)`;
};

const StyledRange = styled.div<{ $fill?: boolean }>`
    position: relative;

    ${({ $fill }) =>
        $fill &&
        css`
            width: 100%;
        `}
`;

type TrackProps = {
    $trackStyle?: CSSObject;
    $mode: RangeMode;
    $progress: number;
    disabled?: boolean; // intentionally not transient (no $), it is HTML attribute of the <input>
};

const track = css<TrackProps>`
    height: ${spacingsPx.xxs};

    ${({ $mode, $progress, disabled }) =>
        $mode === 'normal' &&
        css`
            background: ${({ theme }) => getLinearGradient($progress, theme, disabled)};
        `};

    ${({ $trackStyle }) => $trackStyle}
`;

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

const focusStyle = css`
    border: ${({ theme }) => `1px solid ${theme.backgroundAlertBlueBold}`};
    box-shadow: ${({ theme }) => theme.boxShadowFocused};
`;

const Input = styled.input<{
    $trackStyle?: CSSObject;
    disabled?: boolean;
    $mode: RangeMode;
    $progress: number;
}>`
    position: relative;
    z-index: 10;
    margin: ${spacingsPx.sm} 0 ${spacingsPx.xs};
    padding: 10px 0;
    width: 100%;
    vertical-align: top; /* prevent extra bottom space in Firefox */
    background: none;
    appearance: none;
    cursor: ${({ disabled }) => !disabled && 'pointer'};

    &::-webkit-slider-runnable-track {
        ${track}
    }

    &::-webkit-slider-thumb {
        ${thumb};
    }

    &::-moz-range-track {
        ${track}
    }

    &::-moz-range-thumb {
        ${thumb};

        ${({ $mode }) =>
            $mode === 'segments' &&
            css`
                transform: translateY(6px); /* Firefox hack because of position in Segments */
            `}
    }

    &:focus-visible {
        &::-webkit-slider-thumb {
            ${focusStyle}
        }

        ::-moz-range-thumb {
            ${focusStyle}
        }
    }

    &:disabled {
        pointer-events: auto;
        cursor: not-allowed;
    }
`;

const Label = styled.div<{ disabled?: boolean; $width?: number }>`
    position: relative;
    justify-self: center;
    padding-top: ${spacingsPx.xxxs};
    min-width: ${({ $width }) => `${$width}px`};
    text-align: center;
    color: ${({ theme }) => theme.textSubdued};
    ${typography.label}
    cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};

    &:first-child {
        text-align: left;
    }
`;

const LabelsWrapper = styled.div<{ $count: number; $width?: number }>`
    display: grid;
    grid-template-columns: ${({ $count, $width }) =>
        `repeat(${$count}, ${$width ? `${$width}px` : '1fr'})`};
    justify-content: space-between;
`;

type LabelsComponentProps = {
    disabled?: boolean;
    labels: Segment[];
    onLabelClick?: (value: number) => void;
};

const LabelsComponent = ({ disabled, labels, onLabelClick }: LabelsComponentProps) => {
    const [labelsElWidth, setLabelsElWidth] = useState<number>();

    const lastLabelRef = useRef<HTMLParagraphElement>(null);

    useLayoutEffect(() => {
        if (!lastLabelRef.current) return;
        setLabelsElWidth(lastLabelRef.current?.getBoundingClientRect().width);
    }, [lastLabelRef, setLabelsElWidth]);

    return (
        <LabelsWrapper $count={labels.length} $width={labelsElWidth}>
            {labels?.map(({ value, component }, i) => {
                const isLastElement = i === labels.length - 1;

                return (
                    <Label
                        key={value}
                        disabled={disabled}
                        $width={labelsElWidth}
                        onClick={() => {
                            const numberValue = Number.parseFloat(String(value));

                            if (disabled || isNaN(numberValue)) return;
                            onLabelClick?.(Number.parseFloat(String(value)));
                        }}
                        ref={isLastElement ? lastLabelRef : undefined}
                    >
                        {component || value}
                    </Label>
                );
            })}
        </LabelsWrapper>
    );
};

const Segments = styled.div`
    position: relative;
    top: calc(-${spacingsPx.sm} - 10px);
    margin-bottom: calc(-${spacingsPx.sm} - 10px);

    width: 100%;
    display: flex;
`;

const StyledSegment = styled.div<{ $start: number; $end: number }>`
    margin-inline: ${spacingsPx.xxxs};
    width: calc(${({ $start, $end }) => $end - $start}% - ${spacingsPx.xxxs} * 2);

    &:first-child {
        margin-left: 0;
    }

    &:last-child {
        margin-right: 0;
    }
`;

const SegmentLine = styled.div<{ $progress: number; disabled?: boolean }>`
    height: ${spacingsPx.xxs};
    background: ${({ $progress, theme, disabled }) =>
        getLinearGradient($progress, theme, disabled)};

    border-radius: ${borders.radii.full};
`;

const SegmentLabel = styled.div`
    margin-top: ${spacingsPx.md};
    padding-top: ${spacingsPx.xxxs};
    text-align: left;
    color: ${({ theme }) => theme.textSubdued};
    ${typography.label}

    span {
        cursor: pointer;
    }
`;

const SegmentLabelButton = styled.button`
    all: unset;
    cursor: pointer;
`;

type SegmentsComponentProps = {
    disabled?: boolean;
    labels: Segment[];
    value: number;
    sliderMin: number;
    sliderMax: number;
    onLabelClick?: (value: number) => void;
};

const SegmentsComponent = ({
    disabled,
    value,
    labels,
    sliderMin,
    sliderMax,
    onLabelClick,
}: SegmentsComponentProps) => {
    return (
        <Segments>
            {labels.map(({ max, value: labelValue, component }, index) => {
                if (sliderMin === max) return;

                const previousSegment = labels?.[index - 1] ?? DEFAULT_SEGMENT;
                const progress = getProgress(value, max, previousSegment.max, sliderMin, sliderMax);
                const normalizedPreviousMax = normalizeValue(
                    previousSegment.max,
                    sliderMin,
                    sliderMax,
                );
                const normalizedSegmentMax = normalizeValue(max, sliderMin, sliderMax);

                return (
                    <StyledSegment
                        key={`${index}_${labelValue}`}
                        $start={normalizedPreviousMax}
                        $end={normalizedSegmentMax}
                    >
                        <SegmentLine $progress={progress} disabled={disabled} />
                        <SegmentLabel>
                            <SegmentLabelButton
                                type="button"
                                onClick={() => onLabelClick?.(max)}
                                style={{ all: 'unset', cursor: 'pointer' }}
                            >
                                {component || labelValue}
                            </SegmentLabelButton>
                        </SegmentLabel>
                    </StyledSegment>
                );
            })}
        </Segments>
    );
};

export interface RangeProps {
    className?: string;
    disabled?: boolean;
    fill?: boolean;
    labels?: Segment[];
    max?: number;
    min?: number;
    mode?: RangeMode;
    onChange: ChangeEventHandler<HTMLInputElement>;
    onKeyDown?: KeyboardEventHandler;
    onLabelClick?: (value: number) => void;
    step?: string;
    trackStyle?: CSSObject;
    value: number;
}

export const Range = ({
    className,
    disabled = false,
    fill = false,
    labels,
    mode = 'normal',
    onLabelClick,
    trackStyle,
    ...props
}: RangeProps) => {
    const handleLabelClick = useCallback(
        (value: number) => {
            if (disabled || !onLabelClick) return;
            onLabelClick(value);
        },
        [disabled, onLabelClick],
    );

    return (
        <StyledRange className={className} $fill={fill}>
            <Input
                {...props}
                type="range"
                disabled={disabled}
                $trackStyle={trackStyle}
                $mode={mode}
                $progress={props.value}
            />
            {labels?.length != null && (
                <>
                    {mode === 'normal' && (
                        <LabelsComponent
                            disabled={disabled}
                            labels={labels}
                            onLabelClick={handleLabelClick}
                        />
                    )}
                    {mode === 'segments' && (
                        <SegmentsComponent
                            disabled={disabled}
                            labels={labels}
                            value={props.value}
                            sliderMin={props.min ?? 0}
                            sliderMax={props.max ?? labels.at(-1)?.max ?? 100}
                            onLabelClick={handleLabelClick}
                        />
                    )}
                </>
            )}
        </StyledRange>
    );
};
