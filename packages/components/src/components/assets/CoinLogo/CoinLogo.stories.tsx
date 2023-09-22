import styled from 'styled-components';
import { CoinLogo as CoinLogoComponent, CoinLogoProps, variables } from '../../../index';
import { StoryObj } from '@storybook/react';

const Center = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
    padding: 100px 0px;
`;

export default {
    title: 'Assets/CoinLogos',
    component: CoinLogoComponent,
};

export const CoinLogo: StoryObj<CoinLogoProps> = {
    render: args => (
        <Center>
            <CoinLogoComponent size={args.size} symbol={args.symbol} />
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
