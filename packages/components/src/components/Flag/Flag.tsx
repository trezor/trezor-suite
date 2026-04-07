import styled, { css } from 'styled-components';

import { resolveStaticPath } from '@trezor/env-utils';

import { type FlagSize, type FlagType } from './types';
import { mapSizeToBorderRadius, mapSizeToOutlineWidth } from './utils';
import { IMAGES_PATH } from '../Image/Image';

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
        <FlagImage
            $size={size}
            src={resolveStaticPath(`${IMAGES_PATH}/flags/${country.toLowerCase()}.svg`)}
            alt={`flag-${country}`}
        />
    </Wrapper>
);
