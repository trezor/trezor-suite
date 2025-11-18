import { ImgHTMLAttributes } from 'react';

import styled from 'styled-components';

import { resolveStaticPath } from '@trezor/env-utils';
import { isArrayMember, typedObjectEntries } from '@trezor/utils';

import { IMAGES, ImageType } from './images';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';

export const allowedImageFrameProps = [
    'margin',
    'width',
    'height',
    'borderRadius',
    'maxWidth',
    'maxHeight',
    'flex',
    'objectFit',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedImageFrameProps)[number]>;

export const IMAGES_PATH = 'images/images';

export type ImageKey = ImageType;

const buildSrcSet = (imageKey: ImageType) => {
    const imageFile1x = IMAGES[imageKey];
    const imageFile2x = IMAGES[`${String(imageKey)}_2x` as ImageType];

    if (!imageFile2x) {
        return undefined;
    }

    return `
        ${resolveStaticPath(`${IMAGES_PATH}/${imageFile1x}`)} 1x,
        ${resolveStaticPath(`${IMAGES_PATH}/${imageFile2x}`)} 2x
    `;
};

const isPNGImageKey = (key: ImageKey): key is ImageType => key in IMAGES;

const getSourceProps = (imageKey: ImageKey) => {
    if (isPNGImageKey(imageKey)) {
        return {
            src: resolveStaticPath(`${IMAGES_PATH}/${IMAGES[imageKey]}`),
            srcSet: buildSrcSet(imageKey),
        };
    }

    return { src: resolveStaticPath(`${IMAGES_PATH}/${IMAGES[imageKey]}`) };
};

const StyledImage = styled.img<TransientProps<AllowedFrameProps & { isFilterActive?: boolean }>>`
    max-width: 100%;
    filter: ${({ theme, $isFilterActive }) =>
        $isFilterActive ? theme.legacy.IMAGE_FILTER : 'none'};

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
    ) & { isFilterActive?: boolean };

const getImageHTMLProps = (
    imageProps: Omit<ImageProps, 'image' | 'imageSrc' | 'isFilterActive'>,
): ImageHTMLProps =>
    typedObjectEntries(imageProps).reduce<ImageHTMLProps>(
        (imageHTMLProps, [propKey, propValue]) => {
            if (!isArrayMember(propKey, allowedImageFrameProps)) {
                imageHTMLProps[propKey] = propValue;
            }

            return imageHTMLProps;
        },
        {},
    );

export const Image = ({ image, imageSrc, isFilterActive = false, ...rest }: ImageProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedImageFrameProps);
    const imageHTMLProps = getImageHTMLProps(rest);
    const sourceProps = image ? getSourceProps(image) : { src: imageSrc };

    return (
        <StyledImage
            {...sourceProps}
            {...imageHTMLProps}
            {...frameProps}
            $isFilterActive={isFilterActive}
        />
    );
};
