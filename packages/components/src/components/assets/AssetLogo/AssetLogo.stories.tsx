import styled from 'styled-components';
import { Meta, StoryObj } from '@storybook/react';
import { AssetLogo as AssetLogoComponent, AssetLogoProps } from './AssetLogo';
import { variables } from '../../../config';

const Center = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
    padding: 100px 0;
`;

const meta: Meta = {
    title: 'Assets/AssetLogos',
    component: AssetLogoComponent,
} as Meta;
export default meta;

export const AssetLogo: StoryObj<AssetLogoProps> = {
    render: props => (
        <Center>
            <AssetLogoComponent {...props} />
        </Center>
    ),
    args: {
        symbol: 'ada',
        size: 32,
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
