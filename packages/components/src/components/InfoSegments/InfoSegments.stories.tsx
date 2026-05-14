import { type Meta, type StoryObj } from '@storybook/react';

import {
    InfoSegments as InfoSegmentsComponent,
    type InfoSegmentsProps,
    allowedInfoSegmentsFrameProps,
    allowedInfoSegmentsTextProps,
} from './InfoSegments';
import { getFramePropsStory } from '../../utils/frameProps';
import { textIntents } from '../typography/Text/Text';
import { getTextPropsStory } from '../typography/utils';

const meta: Meta<typeof InfoSegmentsComponent> = {
    title: 'InfoSegments',
    component: InfoSegmentsComponent,
};
export default meta;

export const InfoSegments: StoryObj<InfoSegmentsProps> = {
    args: {
        children: ['Left', 'Right'],
        ...getFramePropsStory(allowedInfoSegmentsFrameProps).args,
        ...getTextPropsStory(allowedInfoSegmentsTextProps).args,
    },
    argTypes: {
        intent: {
            control: {
                type: 'select',
            },
            options: textIntents,
        },
        ...getFramePropsStory(allowedInfoSegmentsFrameProps).argTypes,
        ...getTextPropsStory(allowedInfoSegmentsTextProps).argTypes,
    },
};
