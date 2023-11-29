import { ImgHTMLAttributes } from 'react';
import styled from 'styled-components';
import { PngImage, SvgImage, PNG_IMAGES, SVG_IMAGES } from './images';
import { resolveStaticPath } from '../../utils/resolveStaticPath';

export const PNG_PATH = 'images/png';
export const SVG_PATH = 'images/svg';

const StyledImage = styled.img`
    /* should not overflow it's container */
    max-width: 100%;
    filter: ${({ theme }) => theme.IMAGE_FILTER};
`;

const buildSrcSet = <
    BasePath extends string,
    ImageObject extends typeof PNG_IMAGES | typeof SVG_IMAGES,
    ImageKey extends keyof ImageObject,
>(
    basePath: BasePath,
    imageObject: ImageObject,
    imageKey: ImageKey,
) => {
    const imageFile1x = imageObject[imageKey];
    const hiRes = `${String(imageKey)}_2x`;
    const imageFile2x = hiRes in imageObject ? imageObject[hiRes as ImageKey] : undefined;

    if (!imageFile2x) {
        return undefined;
    }

    return `${resolveStaticPath(`${basePath}/${imageFile1x}`)} 1x, ${resolveStaticPath(
        `${basePath}/${imageFile2x}`,
    )} 2x`;
};

export type ImageType = PngImage | SvgImage;

export type ImageProps = ImgHTMLAttributes<Omit<HTMLImageElement, 'src'>> &
    (
        | {
              image: ImageType;
          }
        | {
              imageSrc: string;
          }
    );

const isPNG = (image: ImageType): image is PngImage => image in PNG_IMAGES;
const isSVG = (image: ImageType): image is SvgImage => image in SVG_IMAGES;

export const Image = (props: ImageProps) => {
    if ('image' in props) {
        const { image } = props;
        if (isPNG(image)) {
            return (
                <StyledImage
                    src={resolveStaticPath(`${PNG_PATH}/${PNG_IMAGES[image]}`)}
                    srcSet={buildSrcSet(PNG_PATH, PNG_IMAGES, image)}
                    {...props}
                />
            );
        }

        if (isSVG(image)) {
            return (
                <StyledImage
                    src={resolveStaticPath(`${SVG_PATH}/${SVG_IMAGES[image]}`)}
                    srcSet={buildSrcSet(SVG_PATH, SVG_IMAGES, image)}
                    {...props}
                />
            );
        }
    }

    if ('imageSrc' in props) {
        return <StyledImage src={props.imageSrc} {...props} />;
    }

    return null;
};
