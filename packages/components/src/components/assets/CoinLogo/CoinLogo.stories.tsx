import styled from 'styled-components';
import { Meta, StoryObj } from '@storybook/react';
import { CoinLogo as CoinLogoComponent, CoinLogoProps, variables } from '../../../index';

const Center = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
    padding: 100px 0px;
`;

export default {
    title: 'Assets/CoinLogos',
    component: CoinLogoComponent,
} as Meta;

export const CoinLogo: StoryObj<CoinLogoProps> = {
    render: ({ symbol, size }) => (
        <Center>
            <CoinLogoComponent symbol={symbol} size={size} />
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
