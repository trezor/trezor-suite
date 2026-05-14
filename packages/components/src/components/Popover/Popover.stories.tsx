import { type Meta, type StoryObj } from '@storybook/react';
import { useArgs } from 'storybook/preview-api';
import styled from 'styled-components';

import { spacingsPx } from '@trezor/theme';

import { Popover as PopoverComponent, type PopoverProps } from './Popover';
import {
    POPOVER_PLACEMENT_ALIGNMENT,
    POPOVER_PLACEMENT_POSITION,
    type PopoverPlacement,
    type PopoverPlacementAlignment,
    type PopoverPlacementPosition,
} from './utils';
import { Card } from '../Card/Card';
import { Button } from '../buttons/Button/Button';

const Container = styled.div`
    width: 100%;
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
    gap: ${spacingsPx.xxl};
    padding: 5rem;
`;

const Content = () => <Card>Lorem ipsum dolor sit amet</Card>;

const meta: Meta<typeof PopoverComponent> = {
    title: 'Popover',
    component: PopoverComponent,
};
export default meta;

type PopoverStoryProps = PopoverProps & {
    placementPosition: PopoverPlacementPosition;
    placementAlignment: PopoverPlacementAlignment;
};

export const Popover: StoryObj<PopoverStoryProps> = {
    render: (args: PopoverStoryProps) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [, updateArgs] = useArgs();

        const placement: PopoverPlacement = {
            position: args.placementPosition,
            alignment: args.placementAlignment,
        };

        return (
            <Container>
                <PopoverComponent
                    isInitialOpen={args.isInitialOpen}
                    placement={placement}
                    content={<Content />}
                >
                    <Button>Uncontrolled</Button>
                </PopoverComponent>
                <PopoverComponent
                    isOpen={args.isOpen}
                    popoverOffset={args.popoverOffset}
                    placement={placement}
                    content={<Content />}
                >
                    <Button onClick={() => updateArgs({ isOpen: !args.isOpen })}>Controlled</Button>
                </PopoverComponent>
            </Container>
        );
    },
    args: {
        isOpen: false,
        popoverOffset: 5,
        placementPosition: 'center',
        placementAlignment: 'center',
    },
    argTypes: {
        isInitialOpen: {
            control: {
                type: 'boolean',
            },
        },
        isOpen: {
            control: {
                type: 'boolean',
            },
        },
        popoverOffset: {
            control: {
                type: 'number',
            },
        },
        placementPosition: {
            control: {
                type: 'select',
            },
            options: POPOVER_PLACEMENT_POSITION,
        },
        placementAlignment: {
            control: {
                type: 'select',
            },
            options: POPOVER_PLACEMENT_ALIGNMENT,
        },
    },
};
