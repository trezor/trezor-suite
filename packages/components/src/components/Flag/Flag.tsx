import styled, { css } from 'styled-components';

// TODO: suite-common imports in non-suite packages should not be allowed
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import {
    type FlagSize,
    type FlagType,
    getFlagSource,
    mapSizeToBorderRadius,
    mapSizeToOutlineWidth,
} from '@suite-common/flags';

export type FlagProps = {
    country: FlagType;
    size?: FlagSize;
};

const Wrapper = styled.div<{ $size: FlagSize }>`
    display: flex;
    align-items: center;
    width: ${({ $size }) => `${$size}px`};
    height: ${({ $size }) => `${$size}px`};
    flex-shrink: 0;
`;

const FlagImage = styled.img<{ $size: FlagSize }>`
    width: 100%;
    display: block;
    background: ${({ theme }) => theme.elementFillOnDarkContrast};

    ${({ $size, theme }) => css`
        outline: ${mapSizeToOutlineWidth($size)}px solid ${theme.elementBorderNeutralSofter};
        outline-offset: -${mapSizeToOutlineWidth($size)}px;
        border-radius: ${mapSizeToBorderRadius($size)}px;
        background: ${theme.elementFillOnDarkContrast};
    `}
`;

export const Flag = ({ size = 24, country }: FlagProps) => (
    <Wrapper $size={size}>
        <FlagImage $size={size} src={getFlagSource(country)} alt={`flag-${country}`} />
    </Wrapper>
);
