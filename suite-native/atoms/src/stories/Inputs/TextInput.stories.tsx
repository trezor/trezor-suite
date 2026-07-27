import type { Meta, StoryObj } from '@storybook/react-native';
import { useArgs } from 'storybook/preview-api';

import { ICON_NAMES } from '@suite-native/icons';

import { Input as InputComponent, type InputProps, type TextInputType } from '../../Input/Input';
import { InputWrapper } from '../../Input/InputWrapper';

// `labelText` / `placeholderText` are story-only controls so both can be held in args at once; the
// render fn routes exactly one of Input's `label` / `placeholder` based on `labelType` (InputProps
// only allows one of them at a time).
type TextInputArgs = InputProps & {
    labelType: TextInputType;
    labelText: string;
    placeholderText: string;
    hint: string;
    error: string;
};

type TextInputStory = StoryObj<TextInputArgs>;

const meta: Meta<TextInputArgs> = {
    title: 'Atoms/Inputs',
    component: InputComponent,
    render: function TextInputRender(args) {
        const [_, updateArgs] = useArgs();

        // To make the Input discriminated unions happy with the Strorybook inputs typing.
        const isInnerLabel = args.labelType === 'innerLabel';
        const isOutsideLabel = args.labelType === 'outsideLabel';
        const inputVariantProps = isInnerLabel
            ? { labelType: 'innerLabel' as const, label: args.labelText }
            : { labelType: args.labelType, placeholder: args.placeholderText };

        return (
            <InputWrapper
                hint={args.hint}
                label={isOutsideLabel ? args.labelText : undefined}
                error={args.error}
            >
                <InputComponent
                    {...inputVariantProps}
                    value={args.value}
                    editable={args.editable}
                    hasError={!!args.error}
                    rightIcon={args.rightIcon}
                    onChangeText={(text: string) => updateArgs({ value: text })}
                />
            </InputWrapper>
        );
    },
};

export default meta;

export const TextInput: TextInputStory = {
    name: 'TextInput',
    args: {
        value: '',
        labelType: 'innerLabel',
        labelText: 'Label',
        placeholderText: 'Placeholder',
        hint: 'This is a hint',
        editable: true,
        rightIcon: 'qrCode',
    },
    argTypes: {
        labelType: {
            control: { type: 'select' },
            options: ['innerLabel', 'outsideLabel', 'noLabel'],
        },
        labelText: {
            control: { type: 'text' },
        },
        placeholderText: {
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
        rightIcon: {
            control: { type: 'select' },
            options: [undefined, ...ICON_NAMES],
        },
        error: {
            control: { type: 'text' },
        },
    },
};
