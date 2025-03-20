import { useArgs } from '@storybook/client-api';
import { Meta, StoryObj } from '@storybook/react';

import {
    Switch as SwitchComponent,
    SwitchProps,
    allowedSwitchFrameProps,
    labelPositions,
    switchSizes,
} from './Switch';
import { getFramePropsStory } from '../../../utils/frameProps';

const meta: Meta = {
    title: 'Form',
} as Meta;
export default meta;

export const Switch: StoryObj<SwitchProps> = {
    render: () => {
        // eslint-disable-next-line
        const [{ isChecked, ...rest }, updateArgs] = useArgs();
        const handleIsChecked = () => updateArgs({ isChecked: !isChecked });

        return <SwitchComponent onChange={handleIsChecked} isChecked={isChecked} {...rest} />;
    },
    args: {
        isAlert: false,
        isChecked: false,
        isDisabled: false,
        size: 'medium',
        label: 'Headline',
        labelPosition: 'end',
        ...getFramePropsStory(allowedSwitchFrameProps).args,
    },
    argTypes: {
        isAlert: {
            control: {
                type: 'boolean',
            },
        },
        isChecked: {
            control: {
                type: 'boolean',
            },
        },
        isDisabled: {
            control: {
                type: 'boolean',
            },
        },
        size: {
            control: {
                type: 'radio',
            },
            options: switchSizes,
        },
        label: {
            table: {
                type: {
                    summary: 'ReactNode',
                },
            },
        },
        labelPosition: {
            options: labelPositions,
            control: {
                type: 'radio',
            },
        },
        ...getFramePropsStory(allowedSwitchFrameProps).argTypes,
    },
};
