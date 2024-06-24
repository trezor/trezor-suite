import styled, { css } from 'styled-components';

export const BlurWrapper = styled.span<{ $isBlurred: boolean }>`
    ${({ $isBlurred }) =>
        $isBlurred &&
        css`
            filter: blur(2px);
            transition: filter 0.3s;

            &:hover {
                filter: blur(1px);
            }
        `};
`;
