import { Meta, StoryObj } from '@storybook/react';
import { ProgressPie as ProgressPieComponent, ProgressPieProps } from './ProgressPie';

export default {
    title: 'Loaders/ProgressPie',
    component: ProgressPieComponent,
} as Meta;

export const ProgressPie: StoryObj<ProgressPieProps> = {
    args: {
        valueInPercents: 21,
    },
    argTypes: {
        backgroundColor: { control: 'color' },
        className: { control: false },
        children: { control: false },
        color: { control: 'color' },
    },
};
