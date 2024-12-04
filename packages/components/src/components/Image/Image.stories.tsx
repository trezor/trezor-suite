import { Meta, StoryObj } from '@storybook/react';

import { Image as ImageComponent, ImageProps, allowedImageFrameProps } from './Image';
import { PNG_IMAGES, SVG_IMAGES } from './images';
import { getFramePropsStory } from '../../utils/frameProps';

const meta: Meta = {
    title: 'Image',
    component: ImageComponent,
} as Meta;
export default meta;

export const Image: StoryObj<ImageProps> = {
    args: {
        image: 'BACKUP',
        imageSrc: undefined,
        ...getFramePropsStory(allowedImageFrameProps).args,
    },
    argTypes: {
        image: {
            options: Object.keys({ ...SVG_IMAGES, ...PNG_IMAGES }),
            control: {
                type: 'select',
            },
        },
        imageSrc: { type: 'string' },
        ...getFramePropsStory(allowedImageFrameProps).argTypes,
    },
};
