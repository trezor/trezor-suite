import { ReactNode } from 'react';
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
    intensity?: number;
    children: ReactNode;
    className?: string;
    ['data-test']?: string;
}

export const HiddenPlaceholder = ({
    children,
    intensity = 5,
    className,
    ...rest
}: HiddenPlaceholderProps) => {
    const discreetMode = useSelector(selectIsDiscreteModeActive);
    return (
        <Wrapper
            discreetMode={discreetMode}
            intensity={intensity}
            className={className}
            data-test={rest['data-test']}
        >
            {children}
        </Wrapper>
    );
};
