import { useArgs } from '@storybook/client-api';
import { Meta, StoryObj } from '@storybook/react';

import {
    DEFAULT_ORIENTATION,
    SelectBar as SelectBarComponent,
    SelectBarProps,
    orientations,
} from './SelectBar';

const options = [
    { label: 'low', value: 'low' },
    { label: 'medium', value: 'medium' },
    { label: 'high', value: 'high' },
    { label: 'custom', value: 'custom' },
];

const meta: Meta<typeof SelectBarComponent> = {
    title: 'Form',
    component: SelectBarComponent,
    args: {
        label: 'fee',
        options,
        selectedOption: 'low',
        isDisabled: false,
        isFullWidth: undefined,
        orientation: DEFAULT_ORIENTATION,
    },
    argTypes: {
        label: {
            control: {
                type: 'text',
            },
        },
        options: {
            control: {
                type: 'object',
            },
            table: {
                type: {
                    summary: 'Array<{ label: string; value: number }>',
                },
            },
        },
        selectedOption: {
            options: Object.values(options).map(({ value }) => value),
            control: {
                type: 'select',
                labels: options.reduce(
                    (acc, option) => ({ ...acc, [option.value]: option.label }),
                    {},
                ),
            },
        },
        isDisabled: {
            control: {
                type: 'boolean',
            },
        },
        isFullWidth: {
            control: {
                type: 'boolean',
            },
        },
        orientation: {
            options: orientations,
            control: {
                type: 'radio',
            },
        },
    },
};

export default meta;

export const SelectBar: StoryObj<typeof SelectBarComponent> = {
    render: ({ ...args }) => {
        // eslint-disable-next-line
        const [_, updateArgs] = useArgs<SelectBarProps<string>>();
        const setOption = (selectedOption: string) => updateArgs({ selectedOption });

        return (
            <SelectBarComponent
                {...args}
                onChange={setOption}
                options={options}
                selectedOption={args.selectedOption as string | undefined}
            />
        );
    },
};
