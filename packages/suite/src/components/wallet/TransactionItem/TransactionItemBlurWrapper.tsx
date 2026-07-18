import type { ComponentType, PropsWithChildren } from 'react';

import styled, { css } from 'styled-components';

type BlurWrapperProps = {
    $isBlurred: boolean;
};

type BlurWrapperComponent = ComponentType<PropsWithChildren<BlurWrapperProps>>;

const StyledBlurWrapper = styled.span<BlurWrapperProps>`
    ${({ $isBlurred }) =>
        $isBlurred &&
        css`
            filter: blur(3px);
            transition: filter 0.3s;

            &:hover {
                filter: blur(1px);
            }
        `};
`;

export const BlurWrapper: BlurWrapperComponent = StyledBlurWrapper;
