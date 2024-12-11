import { MouseEventHandler, ReactNode, useLayoutEffect, useRef, useState } from 'react';

import styled, { css } from 'styled-components';

import { RedactNumbersContext } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';
import { selectIsDiscreteModeActive } from 'src/reducers/wallet/settingsReducer';

type MouseCoords = { clientX: number; clientY: number };

const PIXELS_TOLERANCE = 0.5;
const approxEqual = (a: number, b: number) => Math.abs(a - b) < PIXELS_TOLERANCE;

type WrapperProps = {
    $intensity: number;
    $discreetMode: boolean;
    $minWidth?: number;
};

const Wrapper = styled.span<WrapperProps>`
    font-variant-numeric: tabular-nums;
    display: inline;

    ${({ $intensity, $discreetMode }: WrapperProps) =>
        $discreetMode &&
        css`
            transition: all 0.1s ease;
            filter: blur(${$intensity}px);

            &:hover {
                filter: none;
            }
        `}

    ${({ $minWidth }: WrapperProps) =>
        !!$minWidth &&
        css`
            display: inline-block;
            min-width: ${$minWidth}px;
        `}
`;

export type HiddenPlaceholderProps = {
    enforceIntensity?: number;
    children: ReactNode;
    className?: string;
    disableKeepingWidth?: boolean;
    'data-testid'?: string;
};

/**
 * Wrapper for sensitive information, which should be hidden in discreet mode.
 * ATTENTION: this is only half of the functionality, see also RedactNumericalValue
 *
 * HiddenPlaceholder does following:
 * 1) applies CSS blur, which is removed on hover
 * 2) through RedactNumbersContext it passes information downstream, so the content itself can be redacted
 * 3) to prevent flickering on hover, it upholds min-width of redacted content when it is uncovered
 *
 * Note: content cannot be changed centrally here, it's responsibility of downstream components,
 * they may consume the context using useShouldRedactNumbers(), or use RedactNumericalValue helper
 */
export const HiddenPlaceholder = ({
    children,
    enforceIntensity,
    className,
    disableKeepingWidth,
    'data-testid': dataTestId,
}: HiddenPlaceholderProps) => {
    const ref = useRef<HTMLSpanElement>(null);
    const [automaticIntensity, setAutomaticIntensity] = useState(10);
    const [wrapperMinWidth, setWrapperMinWidth] = useState<undefined | number>(undefined);
    const [isHovered, setIsHovered] = useState(false);
    const [mouseEnteredAtCoords, setmouseEnteredAtCoords] = useState<MouseCoords | null>(null);

    const discreetMode = useSelector(selectIsDiscreteModeActive);
    const shouldRedactNumbers = discreetMode && !isHovered;

    useLayoutEffect(() => {
        if (ref.current === null) return;

        const fontSize = Number(
            window
                .getComputedStyle(ref.current, null)
                .getPropertyValue('font-size')
                .replace('px', ''),
        );
        setAutomaticIntensity(fontSize / 5);
    }, []);

    // we only need to handle the case when revealed content is smaller than redacted, not vice versa.
    // in such case, onMouseEnter shrinks content, and it may immediately onMouseLeave even when cursor is still.
    const onMouseEnter: MouseEventHandler<HTMLSpanElement> = ({ clientX, clientY }) => {
        setIsHovered(true);
        setmouseEnteredAtCoords({ clientX, clientY });
        if (ref?.current) {
            setWrapperMinWidth(ref.current.getBoundingClientRect().width);
        }
    };
    const onMouseLeave: MouseEventHandler<HTMLSpanElement> = ({ clientX, clientY }) => {
        // prevent flickering that may happen when mouse cursor stands still exactly at the element edge
        if (
            mouseEnteredAtCoords !== null &&
            approxEqual(clientX, mouseEnteredAtCoords.clientX) &&
            approxEqual(clientY, mouseEnteredAtCoords.clientY)
        ) {
            return;
        }

        setIsHovered(false);
        setWrapperMinWidth(undefined);
    };

    // edge case: user enters the element, and then leaves through the same pixel. onMouseLeave would then return
    const onMouseMove = () => setmouseEnteredAtCoords(null);

    const shouldEnforceMinWidth = discreetMode && !disableKeepingWidth;

    return (
        <Wrapper
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onMouseMove={onMouseMove}
            $discreetMode={discreetMode}
            $intensity={enforceIntensity !== undefined ? enforceIntensity : automaticIntensity}
            $minWidth={shouldEnforceMinWidth ? wrapperMinWidth : undefined}
            className={className}
            ref={ref}
            data-testid={dataTestId}
        >
            <RedactNumbersContext.Provider value={{ shouldRedactNumbers }}>
                {children}
            </RedactNumbersContext.Provider>
        </Wrapper>
    );
};
