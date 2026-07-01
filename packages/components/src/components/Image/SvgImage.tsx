import { ReactSVG } from 'react-svg';

import styled from 'styled-components';

import { resolveStaticPath } from '@trezor/env-utils';
import { type Color } from '@trezor/theme';

import { IMAGES_PATH } from './Image';
import { IMAGES, type ImageType } from './images';

const Container = styled.div<{ $width?: number; $height?: number; $color?: Color }>`
    display: flex;
    align-items: center;

    path {
        fill: ${({ theme, $color }) => ($color !== undefined ? theme[$color] : 'currentColor')};
    }

    svg {
        display: block;
        width: ${({ $width }) => ($width !== undefined ? `${$width}px` : 'auto')};
        height: ${({ $height }) => ($height !== undefined ? `${$height}px` : 'auto')};
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
    width?: number;
    height?: number;
    color?: Color;
};

const getImageSrc = (image: ImageType) => resolveStaticPath(`${IMAGES_PATH}/${IMAGES[image]}`);

export const SvgImage = ({ image, width, height, color }: SvgImageProps) => (
    <Container $width={width} $height={height} $color={color}>
        <StyledReactSVG src={getImageSrc(image)} loading={() => null} />
    </Container>
);
