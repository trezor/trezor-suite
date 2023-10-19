import { useArgs } from '@storybook/client-api';
import { StoryObj } from '@storybook/react';

import { Range as RangeComponent } from './Range';

export default {
    title: 'Form/Range',
};

export const Range: StoryObj<typeof RangeComponent> = {
    render: args => {
        // eslint-disable-next-line
        const [, updateArgs] = useArgs();

        return <RangeComponent {...args} onChange={e => updateArgs({ value: e.target.value })} />;
    },
    args: {
        max: 100,
        min: 0,
        value: 21,
    },
    argTypes: {
        className: {
            control: false,
        },
        onChange: {
            control: false,
        },
    },
};
