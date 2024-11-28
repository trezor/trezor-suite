import { Meta, StoryObj } from '@storybook/react';

import {
    InfoSegments as InfoSegmentsComponent,
    allowedInfoSegmentsFrameProps,
    allowedInfoSegmentsTextProps,
    InfoSegmentsProps,
} from './InfoSegments';
import { getFramePropsStory } from '../../utils/frameProps';
import { getTextPropsStory } from '../typography/utils';
import { textVariants } from '../typography/Text/Text';

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
