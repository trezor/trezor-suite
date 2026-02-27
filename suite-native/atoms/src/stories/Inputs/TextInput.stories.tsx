import type { Meta, StoryObj } from '@storybook/react-native';
import { useArgs } from 'storybook/preview-api';

import { Input as InputComponent, InputProps } from '../../Input/Input';
import { InputWrapper } from '../../Input/InputWrapper';
import { SURFACE_ELEVATIONS } from '../../types';

type TextInputArgs = InputProps & { wrapperLabel: string; hint: string; error: string };

type TextInputStory = StoryObj<TextInputArgs>;

const meta: Meta<TextInputArgs> = {
    title: 'Atoms/Inputs',
    component: InputComponent,
    decorators: [
        (Story, { context: { args } }) => {
            const [_, updateArgs] = useArgs();

            return (
                <InputWrapper hint={args.hint} label={args.wrapperLabel} error={args.error}>
                    <Story
                        args={{
                            ...args,
                            hasError: !!args.error,
                            onChangeText: (text: string) => updateArgs({ value: text }),
                        }}
                    />
                </InputWrapper>
            );
        },
    ],
};

export default meta;

export const TextInput: TextInputStory = {
    name: 'TextInput',
    args: {
        value: '',
        wrapperLabel: 'Wrapper label',
        hint: 'This is a hint: always define only label or placeholder, never both',
        label: 'Label',
        editable: true,
        keepPlaceholderOnFocus: false,
    },
    argTypes: {
        label: {
            control: { type: 'text' },
        },
        hint: {
            control: { type: 'text' },
        },
        value: {
            control: { type: 'text' },
        },
        editable: {
            control: { type: 'boolean' },
        },
        placeholder: {
            control: { type: 'text' },
        },
        error: {
            control: { type: 'text' },
        },
        elevation: {
            control: { type: 'select' },
            options: SURFACE_ELEVATIONS,
        },
        keepPlaceholderOnFocus: {
            control: { type: 'boolean' },
        },
    },
};
