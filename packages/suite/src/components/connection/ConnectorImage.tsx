import styled from 'styled-components';

import { resolveStaticPath } from '@suite-common/suite-utils';
import { IMAGES, IMAGES_PATH, Image } from '@trezor/components';

const ImageWrapper = styled.div<{
    $maxHeight?: number;
}>`
    width: 61px;
    height: 167px;
    max-height: ${({ $maxHeight }) => ($maxHeight ? `${$maxHeight}px` : 'none')};
    object-fit: contain;
`;

export type ConnectorImageProps = {
    maxHeight?: number;
};

export const ConnectorImage = ({ maxHeight }: ConnectorImageProps) => (
    <ImageWrapper $maxHeight={maxHeight}>
        <Image imageSrc={resolveStaticPath(`${IMAGES_PATH}/${IMAGES.CONNECTOR}`)} />
    </ImageWrapper>
);
