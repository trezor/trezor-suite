import { type Placement } from '@floating-ui/react';
import { type Meta, type StoryObj } from '@storybook/react';
import styled from 'styled-components';

import {
    Tooltip as TooltipComponent,
    type TooltipProps,
    allowedTooltipFrameProps,
} from './Tooltip';
import {
    TOOLTIP_DELAY_LONG,
    TOOLTIP_DELAY_NONE,
    TOOLTIP_DELAY_NORMAL,
    TOOLTIP_DELAY_SHORT,
} from './TooltipDelay';
import { getFramePropsStory } from '../../utils/frameProps';

const Addon = styled.span`
    background: blue;
    padding: 4px 8px;
    border-radius: 4px;
    color: white;
`;

const meta: Meta<typeof TooltipComponent> = {
    title: 'Tooltip',
    component: TooltipComponent,
};
export default meta;

const DELAYS = [TOOLTIP_DELAY_NONE, TOOLTIP_DELAY_SHORT, TOOLTIP_DELAY_NORMAL, TOOLTIP_DELAY_LONG];

export const Tooltip: StoryObj<TooltipProps> = {
    render: (args: TooltipProps) => (
        <TooltipComponent {...args}>
            <span>Text with tooltip</span>
        </TooltipComponent>
    ),
    args: {
        content: <span>Passphrase is an optional feature.</span>,
        offset: 10,
        hasArrow: false,
        hasIcon: false,
        delayHide: TOOLTIP_DELAY_SHORT,
        delayShow: TOOLTIP_DELAY_SHORT,
        ...getFramePropsStory(allowedTooltipFrameProps).args,
    },
    argTypes: {
        hasArrow: {
            type: 'boolean',
        },
        hasIcon: {
            type: 'boolean',
        },
        tooltipMaxWidth: {
            type: 'number',
        },
        title: {
            control: 'text',
        },
        placement: {
            control: 'select',
            options: [
                'top',
                'top-start',
                'top-end',
                'right',
                'right-start',
                'right-end',
                'bottom',
                'bottom-start',
                'bottom-end',
                'left',
                'left-start',
                'left-end',
            ] as Placement[],
        },
        addon: {
            options: ['null', 'addon'],
            mapping: { null: null, addon: <Addon>Addon</Addon> },
            control: {
                type: 'select',
                labels: {
                    null: 'Null',
                    addon: 'Addon',
                },
            },
        },
        delayHide: {
            control: 'select',
            options: DELAYS,
        },
        delayShow: {
            control: 'select',
            options: DELAYS,
        },
        ...getFramePropsStory(allowedTooltipFrameProps).argTypes,
    },
};
