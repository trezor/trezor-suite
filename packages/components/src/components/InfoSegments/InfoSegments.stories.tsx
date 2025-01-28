import { Meta, StoryObj } from '@storybook/react';

import {
    InfoSegments as InfoSegmentsComponent,
    InfoSegmentsProps,
    allowedInfoSegmentsFrameProps,
    allowedInfoSegmentsTextProps,
} from './InfoSegments';
import { getFramePropsStory } from '../../utils/frameProps';
import { textVariants } from '../typography/Text/Text';
import { getTextPropsStory } from '../typography/utils';

const meta: Meta = {
    title: 'InfoSegments',
    component: InfoSegmentsComponent,
} as Meta;
export default meta;

export const InfoSegments: StoryObj<InfoSegmentsProps> = {
    args: {
        children: ['Left', 'Right'],
        ...getFramePropsStory(allowedInfoSegmentsFrameProps).args,
        ...getTextPropsStory(allowedInfoSegmentsTextProps).args,
    },
    argTypes: {
        variant: {
            control: {
                type: 'select',
            },
            options: textVariants,
        },
        ...getFramePropsStory(allowedInfoSegmentsFrameProps).argTypes,
        ...getTextPropsStory(allowedInfoSegmentsTextProps).argTypes,
    },
};
