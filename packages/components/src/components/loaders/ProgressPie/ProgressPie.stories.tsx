import { Meta, StoryObj } from '@storybook/react';
import { ProgressPie as ProgressPieComponent, ProgressPieProps } from './ProgressPie';

const meta: Meta = {
    title: 'Loaders/ProgressPie',
    component: ProgressPieComponent,
} as Meta;
export default meta;

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
