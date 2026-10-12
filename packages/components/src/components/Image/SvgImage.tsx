import { ReactSVG } from 'react-svg';

import styled from 'styled-components';

import { resolveStaticPath } from '@trezor/env-utils';
import { type Color } from '@trezor/theme';

import { IMAGES_PATH } from './Image';
import { IMAGES, type ImageType } from './images';

const getValueWithUnit = (value?: number | string) =>
    typeof value === 'number' ? `${value}px` : (value ?? 'auto');

const Container = styled.div<{
    $width?: number | string;
    $height?: number | string;
    $color?: Color;
}>`
    display: flex;
    align-items: center;
    width: ${({ $width }) => getValueWithUnit($width)};
    height: ${({ $height }) => getValueWithUnit($height)};

    path {
        fill: ${({ theme, $color }) => ($color !== undefined ? theme[$color] : 'currentColor')};
    }

    div,
    svg {
        width: ${({ $width }) => ($width !== undefined ? '100%' : 'auto')};
        height: ${({ $height }) => ($height !== undefined ? '100%' : 'auto')};
    }

    svg {
        display: block;
    }
`;

const StyledReactSVG = styled(ReactSVG)`
    display: flex;

    div {
        display: flex;
    }
` as typeof ReactSVG;

export type SvgImageProps = {
    image: ImageType;
    width?: number | string;
    height?: number | string;
    color?: Color;
};

const getImageSrc = (image: ImageType) => resolveStaticPath(`${IMAGES_PATH}/${IMAGES[image]}`);

export const SvgImage = ({ image, width, height, color }: SvgImageProps) => (
    <Container data-component="SvgImage" $width={width} $height={height} $color={color}>
        <StyledReactSVG src={getImageSrc(image)} loading={() => null} />
    </Container>
);
