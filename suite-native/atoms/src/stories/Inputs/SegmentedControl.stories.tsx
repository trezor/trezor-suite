import type { Meta, StoryObj } from '@storybook/react-native';
import { useArgs } from 'storybook/preview-api';

import {
    SegmentedControl as SegmentedControlComponent,
    type SegmentedControlProps,
} from '../../SegmentedControl';

type SegmentedControlStory = StoryObj<SegmentedControlProps<string>>;

const meta: Meta<SegmentedControlProps<string>> = {
    title: 'Atoms/Inputs',
    component: SegmentedControlComponent,
    render: args => {
        const [{ selectedValue }, updateArgs] = useArgs();

        return (
            <SegmentedControlComponent
                {...args}
                selectedValue={selectedValue}
                onValueChange={value => updateArgs({ selectedValue: value })}
            />
        );
    },
};

export default meta;

export const SegmentedControl: SegmentedControlStory = {
    name: 'SegmentedControl',
    args: {
        selectedValue: 'standard',
        options: [
            { label: 'Standard fee', value: 'standard' },
            { label: 'Custom', value: 'custom' },
        ],
    },
};
