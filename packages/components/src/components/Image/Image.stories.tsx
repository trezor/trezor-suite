import type { Meta, StoryObj } from '@storybook/react';

import type { ImageProps } from './Image';
import { Image as ImageComponent, allowedImageFrameProps } from './Image';
import { IMAGES } from './images';
import { getFramePropsStory } from '../../utils/frameProps';

const meta: Meta<typeof ImageComponent> = {
    title: 'Image',
    component: ImageComponent,
};
export default meta;

export const Image: StoryObj<ImageProps> = {
    args: {
        image: 'TOUCH',
        imageSrc: undefined,
        ...getFramePropsStory(allowedImageFrameProps).args,
    },
    argTypes: {
        image: {
            options: Object.keys({ ...IMAGES }),
            control: {
                type: 'select',
            },
        },
        imageSrc: { type: 'string' },
        ...getFramePropsStory(allowedImageFrameProps).argTypes,
    },
};
