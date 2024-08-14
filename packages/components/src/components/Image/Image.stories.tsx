import { Meta, StoryObj } from '@storybook/react';
import { Image as ImageComponent, ImageProps } from './Image';
import { PNG_IMAGES, SVG_IMAGES } from './images';

const meta: Meta = {
    title: 'Image',
    component: ImageComponent,
} as Meta;
export default meta;

export const Image: StoryObj<ImageProps> = {
    args: {
        image: 'EARLY_ACCESS',
        width: undefined,
        height: undefined,
        imageSrc: undefined,
    },
    argTypes: {
        image: {
            options: Object.keys({ ...SVG_IMAGES, ...PNG_IMAGES }),
            control: {
                type: 'select',
            },
        },
        imageSrc: { type: 'string' },
        width: { type: 'number' },
        height: { type: 'number' },
    },
};
