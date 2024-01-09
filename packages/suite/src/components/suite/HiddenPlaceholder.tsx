import { ReactNode, useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { useSelector } from 'src/hooks/suite';
import { selectIsDiscreteModeActive } from 'src/reducers/wallet/settingsReducer';

interface WrapperProps {
    intensity: number;
    discreetMode: boolean;
}

const Wrapper = styled.span<WrapperProps>`
    ${(props: WrapperProps) =>
        props.discreetMode &&
        css`
            transition: all 0.1s ease;
            filter: blur(${(props: WrapperProps) => props.intensity}px);

            &:hover {
                filter: none;
            }
        `}
`;

interface HiddenPlaceholderProps {
    enforceIntensity?: number;
    children: ReactNode;
    className?: string;
    ['data-test']?: string;
}

export const HiddenPlaceholder = ({
    children,
    enforceIntensity,
    className,
    ...rest
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

    return (
        <Wrapper
            discreetMode={discreetMode}
            intensity={enforceIntensity !== undefined ? enforceIntensity : automaticIntensity}
            className={className}
            ref={ref}
            data-test={rest['data-test']}
        >
            {children}
        </Wrapper>
    );
};
