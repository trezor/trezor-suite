import { type Meta, type StoryObj } from '@storybook/react';

import {
    ProgressPie as ProgressPieComponent,
    type ProgressPieProps,
    allowedProgressPieFrameProps,
} from './ProgressPie';
import { getFramePropsStory } from '../../../utils/frameProps';

const meta: Meta = {
    title: 'ProgressPie',
    component: ProgressPieComponent,
};
export default meta;

export const ProgressPie: StoryObj<ProgressPieProps> = {
    args: {
        valueInPercents: 21,
        ...getFramePropsStory(allowedProgressPieFrameProps).args,
    },
    argTypes: {
        backgroundColor: { control: 'color' },
        children: { control: false },
        color: { control: 'color' },
        ...getFramePropsStory(allowedProgressPieFrameProps).argTypes,
    },
};
