import { ArgTypes, Meta, StoryObj } from '@storybook/react';
import {
    FlexProps,
    flexAlignItems,
    flexJustifyContent,
    flexWrap,
    Row as RowComponent,
    Column as ColumnComponent,
    allowedFlexFrameProps,
} from './Flex';
import { spacings } from '@trezor/theme';
import styled from 'styled-components';
import { getFramePropsStory } from '../../utils/frameProps';

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

const args: Partial<FlexProps> = {
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

    gap: 8,
    flexWrap: 'wrap',
    isReversed: false,
    ...getFramePropsStory(allowedFlexFrameProps).args,
};
const argTypes: Partial<ArgTypes<FlexProps>> = {
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
    flex: {
        type: 'string',
    },
    isReversed: {
        type: 'boolean',
    },
    flexWrap: {
        options: Object.values(flexWrap),
        control: {
            type: 'select',
        },
    },
    ...getFramePropsStory(allowedFlexFrameProps).argTypes,
};

const meta: Meta = {
    title: 'Layout',
} as Meta;
export default meta;

export const Row: StoryObj<FlexProps> = {
    render: args => (
        <Container>
            <RowComponent {...args} />
        </Container>
    ),
    args,
    argTypes,
};

export const Column: StoryObj<FlexProps> = {
    render: args => (
        <Container>
            <ColumnComponent {...args} />
        </Container>
    ),
    args,
    argTypes,
};
