import { useArgs } from '@storybook/client-api';
import { Meta, StoryObj } from '@storybook/react';

import {
    Checkbox as CheckboxComponent,
    CheckboxProps,
    allowedCheckboxFrameProps,
    checkboxVariants,
    labelAlignments,
    verticalAlignments,
} from './Checkbox';
import { getFramePropsStory } from '../../../utils/frameProps';

const meta: Meta = {
    title: 'Form',
    component: CheckboxComponent,
} as Meta;
export default meta;

export const Checkbox: StoryObj<CheckboxProps> = {
    render: ({ ...args }) => {
        // eslint-disable-next-line
        const [{ isChecked }, updateArgs] = useArgs();
        const handleIsChecked = () => updateArgs({ isChecked: !isChecked });

        return (
            <CheckboxComponent
                variant="primary"
                isChecked={isChecked}
                {...args}
                onClick={handleIsChecked}
            >
                {args.children}
            </CheckboxComponent>
        );
    },
    args: {
        children: 'Checkbox',
        variant: 'primary',
        isChecked: false,
        isDisabled: false,
        labelAlignment: 'end',
        verticalAlignment: 'start',
        ...getFramePropsStory(allowedCheckboxFrameProps).args,
    },

    argTypes: {
        variant: {
            control: {
                type: 'radio',
            },
            options: checkboxVariants,
        },
        labelAlignment: {
            control: {
                type: 'radio',
            },
            options: labelAlignments,
        },
        verticalAlignment: {
            control: {
                type: 'radio',
            },
            options: verticalAlignments,
        },
        ...getFramePropsStory(allowedCheckboxFrameProps).argTypes,
    },
};
