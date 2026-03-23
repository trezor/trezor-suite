import { type Meta, type StoryObj } from '@storybook/react';
import styled from 'styled-components';

import { COIN_LOGO_TYPE, CoinLogo as CoinLogoComponent, type CoinLogoProps } from './CoinLogo';
import { COINS } from '../../constants/coins';

const Center = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
    padding: 100px 0;
`;

const meta: Meta<typeof CoinLogoComponent> = {
    title: 'CoinLogo',
    component: CoinLogoComponent,
};
export default meta;

export const CoinLogo: StoryObj<CoinLogoProps> = {
    render: ({ symbol, size, type }) => (
        <Center>
            <CoinLogoComponent symbol={symbol} size={size} type={type} />
        </Center>
    ),
    args: {
        symbol: 'base',
        type: 'tokenWithNetwork',
    },
    argTypes: {
        size: {
            type: 'number',
        },
        symbol: {
            options: Object.keys(COINS),
            control: {
                type: 'select',
            },
        },
        type: {
            options: COIN_LOGO_TYPE,
            control: {
                type: 'select',
            },
        },
    },
};
