import {
    useLayoutEffect,
    useRef,
    useState,
    ReactNode,
    KeyboardEventHandler,
    ChangeEventHandler,
} from 'react';
import styled, { css, CSSObject } from 'styled-components';
import { borders, boxShadows, spacingsPx, typography } from '@trezor/theme';
import { mediaQueries } from '@trezor/styles';

const track = css<Pick<RangeProps, 'trackStyle' | 'disabled'>>`
    height: ${spacingsPx.xxs};
    background: ${({ theme, disabled }) =>
        disabled ? theme.backgroundNeutralDisabled : theme.backgroundPrimaryDefault};
    border-radius: ${borders.radii.full};

    ${({ trackStyle }) => trackStyle}
`;

const thumb = css<Pick<RangeProps, 'disabled'>>`
    appearance: none;
    background: white;
    border-radius: ${borders.radii.full};
    box-shadow: ${boxShadows.elevation1};
    margin-top: calc((${spacingsPx.xxs} - ${spacingsPx.xl}) / 2);
    width: ${spacingsPx.xl};
    height: ${spacingsPx.xl};
    cursor: ${({ disabled }) => !disabled && 'grab'};

    ${({ disabled }) =>
        !disabled &&
        css`
            :active {
                box-shadow: 0 0 1px 1px rgba(0, 0, 0, 0.04);
                cursor: grabbing;
            }
        `}
`;

const focusStyle = css`
    border: ${({ theme }) => `1px solid ${theme.backgroundAlertBlueBold}`};
    box-shadow: ${boxShadows.focusedLight};
`;

const darkFocusStyle = css`
    border: ${({ theme }) => `1px solid ${theme.backgroundAlertBlueBold}`};
    box-shadow: ${boxShadows.focusedDark};
`;

const Input = styled.input<Pick<RangeProps, 'disabled' | 'trackStyle'>>`
    margin: ${spacingsPx.sm} 0 ${spacingsPx.xs};
    padding: 10px 0;
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
            ${focusStyle}
        }
        ::-moz-range-thumb {
            ${focusStyle}
        }
    }

    ${mediaQueries.dark_theme} {
        :focus-visible {
            ::-webkit-slider-thumb {
                ${darkFocusStyle}
            }
            ::-moz-range-thumb {
                ${darkFocusStyle}
            }
        }
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
    labels?: Array<{ value: string | number; component?: ReactNode }>;
    max?: number;
    min?: number;
    onChange: ChangeEventHandler<HTMLInputElement>;
    onKeyDown?: KeyboardEventHandler;
    onLabelClick?: (value: number) => void;
    step?: string;
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
            <Input {...props} type="range" disabled={disabled} trackStyle={trackStyle} />
            {labels?.length && (
                <LabelsWrapper count={labels.length} $width={labelsElWidth}>
                    {labelComponents}
                </LabelsWrapper>
            )}
        </div>
    );
};
