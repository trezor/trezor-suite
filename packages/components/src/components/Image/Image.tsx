import { ImgHTMLAttributes } from 'react';

import styled from 'styled-components';

import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { PNG_IMAGES, SVG_IMAGES, PngImage, SvgImage } from './images';
import { TransientProps } from '../../utils/transientProps';
import { resolveStaticPath } from '../../utils/resolveStaticPath';

export const allowedImageFrameProps = [
    'margin',
    'width',
    'height',
    'flex',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedImageFrameProps)[number]>;

export const PNG_PATH = 'images/png';
export const SVG_PATH = 'images/svg';

export type ImageKey = PngImage | SvgImage;

const buildSrcSet = (imageKey: PngImage) => {
    const imageFile1x = PNG_IMAGES[imageKey];
    const imageFile2x = PNG_IMAGES[`${String(imageKey)}_2x` as PngImage];

    if (!imageFile2x) {
        return undefined;
    }

    return `
        ${resolveStaticPath(`${PNG_PATH}/${imageFile1x}`)} 1x,
        ${resolveStaticPath(`${PNG_PATH}/${imageFile2x}`)} 2x
    `;
};

const isPNGImageKey = (key: ImageKey): key is PngImage => key in PNG_IMAGES;

const getSourceProps = (imageKey: ImageKey) => {
    if (isPNGImageKey(imageKey)) {
        return {
            src: resolveStaticPath(`${PNG_PATH}/${PNG_IMAGES[imageKey]}`),
            srcSet: buildSrcSet(imageKey),
        };
    }

    return { src: resolveStaticPath(`${SVG_PATH}/${SVG_IMAGES[imageKey]}`) };
};

const StyledImage = styled.img<TransientProps<AllowedFrameProps>>`
    max-width: 100%;
    filter: ${({ theme }) => theme.legacy.IMAGE_FILTER};

    ${withFrameProps}
`;

type ImageHTMLProps = ImgHTMLAttributes<Omit<HTMLImageElement, 'src' | 'width' | 'height'>>;

export type ImageProps = AllowedFrameProps &
    ImageHTMLProps &
    (
        | {
              image: ImageKey;
              imageSrc?: never;
          }
        | {
              image?: never;
              imageSrc: string;
          }
    );

export const Image = ({ image, imageSrc, ...rest }: ImageProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedImageFrameProps);
    const imageProps = Object.entries(rest).reduce((props, [propKey, propValue]) => {
        if (!(propKey in frameProps)) {
            props[propKey as keyof ImageHTMLProps] = propValue;
        }

        return props;
    }, {} as ImageHTMLProps);
    const sourceProps = image ? getSourceProps(image) : { src: imageSrc };

    return <StyledImage {...sourceProps} {...imageProps} {...frameProps} />;
};
