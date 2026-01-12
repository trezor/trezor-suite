import { Meta, StoryObj } from '@storybook/react';
import { useArgs } from 'storybook/preview-api';

import { Checkbox as CheckboxComponent, allowedCheckboxFrameProps } from './Checkbox';
import { labelAlignments, verticalAlignments } from './types';
import { getFramePropsStory } from '../../../utils/frameProps';

const meta: Meta<typeof CheckboxComponent> = {
    title: '✏️ Form',
    component: CheckboxComponent,
};
export default meta;

export const Checkbox: StoryObj<typeof meta> = {
    render: ({ ...args }) => {
        // eslint-disable-next-line
        const [{ isChecked }, updateArgs] = useArgs();
        const handleIsChecked = () => updateArgs({ isChecked: !isChecked });

        return (
            <CheckboxComponent isChecked={isChecked} {...args} onChange={handleIsChecked}>
                {args.children}
            </CheckboxComponent>
        );
    },
    args: {
        children: 'Label',
        isChecked: false,
        isDisabled: false,
        labelAlignment: 'end',
        verticalAlignment: 'start',
        ...getFramePropsStory(allowedCheckboxFrameProps).args,
    },

    argTypes: {
        isChecked: {
            control: 'boolean',
        },
        isDisabled: {
            control: 'boolean',
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
