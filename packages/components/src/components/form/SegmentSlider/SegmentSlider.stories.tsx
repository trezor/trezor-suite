import { useArgs } from '@storybook/client-api';
import { Meta, StoryObj } from '@storybook/react';

import { SegmentSlider as SegmentSliderComponent, SegmentSliderProps } from './SegmentSlider';

const meta: Meta = {
    title: 'Form',
} as Meta;
export default meta;

export const SegmentSlider: StoryObj<SegmentSliderProps> = {
    render: args => {
        // eslint-disable-next-line
        const [, updateArgs] = useArgs();

        return (
            <SegmentSliderComponent
                {...args}
                onChange={value => updateArgs({ value })}
                onLabelClick={value => updateArgs({ value })}
            />
        );
    },
    args: {
        disabled: false,
        segments: [
            {
                max: 30,
                name: 'Reward',
            },
            {
                max: 100,
                name: 'Staked',
            },
        ],
        value: 50,
        onChange: (value: number) => console.log(value),
    },
    argTypes: {
        disabled: {
            control: {
                type: 'boolean',
            },
        },
        segments: {
            control: false,
        },
        value: {
            control: {
                type: 'number',
            },
        },
        onChange: {
            control: false,
        },
    },
};
