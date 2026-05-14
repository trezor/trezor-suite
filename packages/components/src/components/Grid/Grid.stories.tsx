import { type ArgTypes, type Meta, type StoryObj } from '@storybook/react';
import styled from 'styled-components';

import { spacings } from '@trezor/theme';

import { Grid as GridComponent, type GridProps, allowedGridFrameProps } from './Grid';
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
    forceEqualColumns: false,
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
    rowGap: {
        options: Object.values(spacings),
        control: {
            type: 'select',
        },
    },
    columnGap: {
        options: Object.values(spacings),
        control: {
            type: 'select',
        },
    },
    forceEqualColumns: {
        control: {
            type: 'boolean',
        },
    },
    ...getFramePropsStory(allowedGridFrameProps).argTypes,
};

const meta: Meta<typeof GridComponent> = {
    title: 'Grid',
};
export default meta;

export const Grid: StoryObj<typeof meta> = {
    render: gridArgs => (
        <Container>
            <GridComponent {...gridArgs} />
        </Container>
    ),
    args,
    argTypes,
};
