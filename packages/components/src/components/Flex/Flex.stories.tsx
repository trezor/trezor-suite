import { Meta, StoryObj } from '@storybook/react';
import {
    Flex as FlexComponent,
    FlexProps,
    flexAlignItems,
    flexDirection,
    flexJustifyContent,
} from './Flex';
import { spacings } from '@trezor/theme';
import styled from 'styled-components';

const Container = styled.div`
    width: 100%;
`;

const Box = styled.div<{ $color: string }>`
    background: ${({ $color }) => $color};
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 20px;
    font-weight: 900;
`;

const meta: Meta = {
    title: 'Misc/Flex',
    component: FlexComponent,
} as Meta;
export default meta;

export const Flex: StoryObj<FlexProps> = {
    render: args => (
        <Container>
            <FlexComponent {...args} />
        </Container>
    ),
    args: {
        children: [
            <Box key="box-a" $color="salmon">
                A
            </Box>,
            <Box key="box-b" $color="green">
                B
            </Box>,
            <Box key="box-c" $color="royalblue">
                C
            </Box>,
        ],
        direction: 'row',
        gap: 8,
        margin: { top: undefined, right: undefined, bottom: undefined, left: undefined },
    },
    argTypes: {
        direction: {
            options: flexDirection,
            control: {
                type: 'radio',
            },
        },
        justifyContent: {
            options: flexJustifyContent,
            control: {
                type: 'select',
            },
        },
        alignItems: {
            options: flexAlignItems,
            control: {
                type: 'select',
            },
        },
        gap: {
            options: Object.values(spacings),
            control: {
                type: 'select',
            },
        },
        margin: {
            table: {
                category: 'Frame props',
            },
        },
    },
};
