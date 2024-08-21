import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { useSelector } from 'src/hooks/suite';
import { selectIsDiscreteModeActive } from 'src/reducers/wallet/settingsReducer';
import { rewriteReactNodeRecursively } from '@trezor/react-utils';
import { redactNumericalSubstring } from '@suite-common/wallet-utils';

interface WrapperProps {
    $intensity: number;
    $discreetMode: boolean;
}

const Wrapper = styled.span<WrapperProps>`
    font-variant-numeric: tabular-nums;

    ${({ $intensity, $discreetMode }: WrapperProps) =>
        $discreetMode &&
        css`
            transition: all 0.1s ease;
            filter: blur(${$intensity}px);

            &:hover {
                filter: none;
            }
        `}
`;

export interface HiddenPlaceholderProps {
    enforceIntensity?: number;
    children: ReactNode;
    className?: string;
    ['data-testid']?: string;
}

export const HiddenPlaceholder = ({
    children,
    enforceIntensity,
    className,
    'data-testid': dataTestId,
}: HiddenPlaceholderProps) => {
    const ref = useRef<HTMLSpanElement>(null);
    const [automaticIntensity, setAutomaticIntensity] = useState(10);
    const discreetMode = useSelector(selectIsDiscreteModeActive);

    useEffect(() => {
        if (ref.current === null) {
            return;
        }

        const fontSize = Number(
            window
                .getComputedStyle(ref.current, null)
                .getPropertyValue('font-size')
                .replace('px', ''),
        );
        setAutomaticIntensity(fontSize / 5);
    }, []);

    /*
        Recursively redact all numbers in children hierarchy of HiddenPlaceholder.
        This works for children hierarchy that consists of simple components which wrap another 'children'.
        When applied to complex components (Formatters), only the blur is applied from HiddenPlaceholder.
        Redaction is handled in prepareFiatAmountFormatter, prepareCryptoAmountFormatter.
    */
    const modifiedChildren = useMemo(
        () =>
            discreetMode
                ? rewriteReactNodeRecursively(children, redactNumericalSubstring)
                : children,
        [children, discreetMode],
    );

    return (
        <Wrapper
            $discreetMode={discreetMode}
            $intensity={enforceIntensity !== undefined ? enforceIntensity : automaticIntensity}
            className={className}
            ref={ref}
            data-testid={dataTestId}
        >
            {modifiedChildren}
        </Wrapper>
    );
};
