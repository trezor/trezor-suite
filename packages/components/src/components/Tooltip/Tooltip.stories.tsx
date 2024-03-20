import styled from 'styled-components';
import { Tooltip as TooltipComponent, TooltipProps } from './Tooltip';
import { Meta, StoryObj } from '@storybook/react';
import { Placement } from '@floating-ui/react';
import { Elevation, mapElevationToBackground, spacingsPx, zIndices } from '@trezor/theme';
import { ElevationContext, useElevation } from '../ElevationContext/ElevationContext';
import {
    TOOLTIP_DELAY_LONG,
    TOOLTIP_DELAY_NONE,
    TOOLTIP_DELAY_NORMAL,
    TOOLTIP_DELAY_SHORT,
} from './TooltipDelay';
import { useState } from 'react';
import { Button } from '../buttons/Button/Button';

const Center = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xxl};
    justify-content: center;
    align-items: center;
    width: 100%;
    padding: 100px 0;
`;

const HigherZ = styled.div<{ $elevation: Elevation }>`
    display: flex;
    flex-direction: column;
    height: 100px;
    justify-content: center;
    background-color: ${mapElevationToBackground};

    /* Simulate "Modal" */
    z-index: ${zIndices.modal};
    position: relative;
`;

const ModalMock = (args: TooltipProps) => {
    const { elevation } = useElevation();

    return (
        <HigherZ $elevation={elevation}>
            <TooltipComponent {...args}>
                <span>Text with tooltip in Modal</span>
            </TooltipComponent>
        </HigherZ>
    );
};

const Addon = styled.span`
    background: blue;
    padding: 4px 8px;
    border-radius: 4px;
    color: white;
`;

const meta: Meta = {
    title: 'Misc/Tooltip',
    component: TooltipComponent,
} as Meta;
export default meta;

const TooltipWrapper = (args: TooltipProps) => {
    const [open, setOpen] = useState(false);

    return (
        <Center>
            <TooltipComponent {...args}>
                <span>Text with tooltip</span>
            </TooltipComponent>
            <ElevationContext baseElevation={0}>
                <ModalMock {...args} />
            </ElevationContext>

            <TooltipComponent
                {...args}
                delayShow={undefined}
                delayHide={undefined}
                isOpen={open}
                placement="bottom-start"
                content={
                    <div>
                        <Button onClick={() => setOpen(false)}>Click to close</Button>
                    </div>
                }
            >
                <Button onClick={() => setOpen(true)}>Click to open Tooltip</Button>
            </TooltipComponent>
        </Center>
    );
};

const DELAYS = [TOOLTIP_DELAY_NONE, TOOLTIP_DELAY_SHORT, TOOLTIP_DELAY_NORMAL, TOOLTIP_DELAY_LONG];

export const Tooltip: StoryObj<TooltipProps> = {
    render: (args: TooltipProps) => <TooltipWrapper {...args} />,
    args: {
        content: (
            <span>
                Passphrase is an optional feature.
                <TooltipComponent content="Because why not?">Tooltip in tooltip.</TooltipComponent>
            </span>
        ),
        offset: 10,
        delayHide: TOOLTIP_DELAY_SHORT,
        delayShow: TOOLTIP_DELAY_SHORT,
    },
    argTypes: {
        hasArrow: {
            type: 'boolean',
        },
        maxWidth: {
            type: 'number',
        },
        title: {
            options: ['null', 'title'],
            mapping: { null: null, title: <span>Title</span> },
            control: {
                type: 'select',
                labels: {
                    null: 'Null',
                    title: 'Title',
                },
            },
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
        cursor: {
            control: 'select',
            options: ['pointer', 'help', 'not-allowed', 'default'],
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
    },
};
