import { useArgs } from '@storybook/client-api';
import { Meta, StoryObj } from '@storybook/react';

import { SelectBar as SelectBarComponent, SelectBarProps } from './SelectBar';
import { selectBarOrientations, selectBarSizes } from './types';

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
        size: 'large',
        isDisabled: false,
        isFullWidth: undefined,
        orientation: 'auto',
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
        size: {
            control: {
                type: 'select',
            },
            options: selectBarSizes,
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
            options: selectBarOrientations,
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
