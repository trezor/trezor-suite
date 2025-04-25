import { useArgs } from '@storybook/client-api';
import { Meta, StoryObj } from '@storybook/react';

import { Switch as SwitchComponent, SwitchProps, allowedSwitchFrameProps } from './Switch';
import { switchLabelPositions, switchSizes } from './types';
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
        isChecked: false,
        isDisabled: false,
        size: 'medium',
        label: 'Headline',
        labelPosition: 'end',
        ...getFramePropsStory(allowedSwitchFrameProps).args,
    },
    argTypes: {
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
            options: switchLabelPositions,
            control: {
                type: 'radio',
            },
        },
        ...getFramePropsStory(allowedSwitchFrameProps).argTypes,
    },
};
