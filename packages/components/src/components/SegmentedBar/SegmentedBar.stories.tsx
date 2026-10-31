import { type Meta, type StoryObj } from '@storybook/react';

import {
    SegmentedBar as SegmentedBarComponent,
    allowedSegmentedBarFrameProps,
} from './SegmentedBar';
import { getFramePropsStory } from '../../utils/frameProps';

const meta: Meta<typeof SegmentedBarComponent> = {
    title: 'SegmentedBar',
    component: SegmentedBarComponent,
};
export default meta;

export const SegmentedBar: StoryObj<typeof SegmentedBarComponent> = {
    args: {
        segments: [
            { value: 70, color: 'elementFillAccentVioletBold' },
            { value: 30, color: 'elementFillBrandBold' },
        ],
        height: 6,
        gap: 4,
        ...getFramePropsStory(allowedSegmentedBarFrameProps).args,
    },
    argTypes: {
        height: {
            type: 'number',
        },
        gap: {
            type: 'number',
        },
        ...getFramePropsStory(allowedSegmentedBarFrameProps).argTypes,
    },
};
