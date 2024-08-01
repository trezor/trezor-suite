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
    render: ({ symbol, size }) => (
        <Center>
            <AssetLogoComponent symbol={symbol} size={size} />
        </Center>
    ),
    args: {
        symbol: 'ada',
    },
    argTypes: {
        size: {
            type: 'number',
        },
        symbol: {
            options: variables.COINS,
            control: {
                type: 'select',
            },
        },
    },
};
