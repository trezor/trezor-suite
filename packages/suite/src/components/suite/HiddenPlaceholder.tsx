import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
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
            transition: all 0.3s ease;
            filter: blur(${(props: WrapperProps) => props.intensity}px);

            color: transparent;
            background-color: ${({ theme }) => theme.TYPE_LIGHTER_GREY};

            &:hover {
                filter: none;
                color: inherit;
                background-color: inherit;
            }
        `}
`;

const TextWrapper = styled.span``;

const Secret = styled.span`
    display: none;

    ${TextWrapper}:hover & {
        display: inline-block !important;
    }
`;

const Placeholder = styled.span<{ intensity: number | null }>`
    ${({ intensity }) => css`
        transition: all 1s ease;
        filter: blur(${intensity}px);

        display: inline-block;

        ${TextWrapper}:hover & {
            display: none !important;
        }
    `}
`;

interface HiddenTextPlaceholderProps {
    value: string | null;
    className?: string;
    ['data-test']?: string;
}

function ranomString(len: number) {
    const arr = new Uint8Array((len || 40) / 2);

    window.crypto.getRandomValues(arr);
    return Array.from(arr, dec => dec.toString(16).padStart(2, '0')).join('');
}

export const HiddenTextPlaceholder = ({ value, ...props }: HiddenTextPlaceholderProps) => {
    const ref = useRef<HTMLSpanElement>(null);
    const [intensity, setIntensity] = useState(3);
    const discreetMode = useSelector(selectIsDiscreteModeActive);

    const placeholder = useMemo(() => ranomString(value?.length ?? 0), [value]);

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
        setIntensity(fontSize / 5);
    }, []);

    return (
        <TextWrapper ref={ref} {...props}>
            {discreetMode ? (
                <>
                    <Secret>{value}</Secret>
                    <Placeholder intensity={intensity}>{placeholder}</Placeholder>
                </>
            ) : (
                value
            )}
        </TextWrapper>
    );
};

interface HiddenPlaceholderProps {
    children: ReactNode;
    className?: string;
    ['data-test']?: string;
}

export const HiddenPlaceholder = ({ children, className, ...rest }: HiddenPlaceholderProps) => {
    const ref = useRef<HTMLSpanElement>(null);
    const [intensity, setIntensity] = useState(10);
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
        setIntensity(fontSize / 5);
    }, []);

    return (
        <Wrapper
            discreetMode={discreetMode}
            intensity={intensity}
            className={className}
            data-test={rest['data-test']}
            ref={ref}
        >
            {children}
        </Wrapper>
    );
};
