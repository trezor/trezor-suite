import { ArgTypes, Meta, StoryObj } from '@storybook/react';
import { GridProps, Grid as GridComponent, allowedGridFrameProps } from './Grid';
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

const args: Partial<GridProps> = {
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
        <Box key="box-d" $color="gold">
            D
        </Box>,
        <Box key="box-e" $color="purple">
            E
        </Box>,
    ],

    gap: 8,
    columns: 3,
    ...getFramePropsStory(allowedGridFrameProps).args,
};
const argTypes: Partial<ArgTypes<GridProps>> = {
    columns: {
        control: {
            type: 'number',
        },
    },
    gap: {
        options: Object.values(spacings),
        control: {
            type: 'select',
        },
    },
    ...getFramePropsStory(allowedGridFrameProps).argTypes,
};

const meta: Meta = {
    title: 'Grid',
} as Meta;
export default meta;

export const Grid: StoryObj<GridProps> = {
    render: args => (
        <Container>
            <GridComponent {...args} />
        </Container>
    ),
    args,
    argTypes,
};
