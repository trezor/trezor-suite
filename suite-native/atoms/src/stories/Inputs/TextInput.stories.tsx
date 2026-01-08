import type { Meta, StoryObj } from '@storybook/react-native';
import { useArgs } from 'storybook/preview-api';

import { Input as InputComponent, InputProps } from '../../Input/Input';
import { InputWrapper } from '../../Input/InputWrapper';

type TextInputArgs = InputProps & { wrapperLabel: string; hint: string; error: string };

type TextInputStory = StoryObj<TextInputArgs>;

const meta: Meta<TextInputArgs> = {
    title: 'Atoms/Inputs',
    component: InputComponent,
    decorators: [
        (Story, { context: { args } }) => {
            const [{ value }, updateArgs] = useArgs();

            return (
                <InputWrapper hint={args.hint} label={args.wrapperLabel} error={args.error}>
                    <Story
                        args={{
                            ...args,
                            label: undefined,
                            hasError: !!args.error,
                            value,
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
        wrapperLabel: 'Label',
        hint: 'This is a hint',
        placeholder: 'placeholder',
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
        placeholder: {
            control: { type: 'text' },
        },
        error: {
            control: { type: 'text' },
        },
    },
};
