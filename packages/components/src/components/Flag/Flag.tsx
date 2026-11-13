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
    height: auto;
    display: block;
    background: ${({ theme }) => theme.elementFillOnDarkContrast};

    ${({ $size, theme }) => css`
        outline: ${mapSizeToOutlineWidth($size)}px solid ${theme.elementBorderNeutralSofter};
        outline-offset: -${mapSizeToOutlineWidth($size)}px;
        border-radius: ${mapSizeToBorderRadius($size)}px;
        background: ${theme.elementFillOnDarkContrast};
    `}
`;

// The flag assets' viewBox, so the image box keeps its aspect ratio before the file loads.
const FLAG_INTRINSIC_WIDTH = 30;
const FLAG_INTRINSIC_HEIGHT = 24;

export const Flag = ({ size = 24, country }: FlagProps) => (
    <Wrapper $size={size} data-component="Flag">
        <FlagImage
            $size={size}
            src={getFlagSource(country)}
            alt={`flag-${country}`}
            width={FLAG_INTRINSIC_WIDTH}
            height={FLAG_INTRINSIC_HEIGHT}
            loading="lazy"
            decoding="async"
        />
    </Wrapper>
);
