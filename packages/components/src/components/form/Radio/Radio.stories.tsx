import { type Meta, type StoryObj } from '@storybook/react';
import { useArgs } from 'storybook/preview-api';

import { Radio as RadioComponent } from './Radio';
import { getFramePropsStory } from '../../../utils/frameProps';
import { allowedCheckboxFrameProps } from '../Checkbox/Checkbox';
import { labelAlignments, verticalAlignments } from '../Checkbox/types';

const meta: Meta<typeof RadioComponent> = {
    title: '✏️ Form',
    component: RadioComponent,
};
export default meta;

export const Radio: StoryObj<typeof meta> = {
    render: ({ ...args }) => {
        // eslint-disable-next-line
        const [{ isChecked }, updateArgs] = useArgs();
        const handleIsChecked = () => updateArgs({ isChecked: !isChecked });

        return (
            <RadioComponent {...args} onChange={handleIsChecked} isChecked={isChecked}>
                {args.children}
            </RadioComponent>
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
