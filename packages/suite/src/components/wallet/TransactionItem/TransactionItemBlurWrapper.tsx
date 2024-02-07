import styled, { css } from 'styled-components';

export const BlurWrapper = styled.span<{ isBlurred: boolean }>`
    ${({ isBlurred }) =>
        isBlurred &&
        css`
            filter: blur(2px);
            pointer-events: none;
            user-select: none;
        `};
`;
