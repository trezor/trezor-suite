import styled from 'styled-components';
import { Meta, StoryObj } from '@storybook/react';
import {
    AssetShareIndicator as AssetShareIndicatorComponent,
    AssetShareIndicatorProps,
} from './AssetShareIndicator';
import { variables } from '../../../config';

const Center = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
    padding: 100px 0;
`;

const meta: Meta = {
    title: 'Assets/AssetShareIndicator',
    component: AssetShareIndicatorComponent,
} as Meta;
export default meta;

export const AssetShareIndicator: StoryObj<AssetShareIndicatorProps> = {
    render: props => (
        <Center>
            <AssetShareIndicatorComponent {...props} />
        </Center>
    ),
    args: {
        symbol: 'ada',
        size: 32,
        percentageShare: 25,
    },
    argTypes: {
        symbol: {
            options: {
                'No symbol': null,
                ...variables.COINS.reduce((acc, icon) => ({ ...acc, [icon]: icon }), {}),
            },
            control: {
                type: 'select',
            },
        },
        size: {
            options: [16, 24, 32, 48],
            control: {
                type: 'select',
            },
        },
        percentageShare: {
            type: 'number',
        },
        index: {
            type: 'number',
        },
        coingeckoId: {
            type: 'string',
        },
        contractAddress: {
            type: 'string',
        },
    },
};
