import { Meta, StoryObj } from '@storybook/react';
import styled from 'styled-components';

import { COIN_LOGO_TYPE, CoinLogoProps } from './CoinLogo';
import { COINS } from './coins';
import { CoinLogo as CoinLogoComponent } from '../../index';

const Center = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
    padding: 100px 0;
`;

const meta: Meta = {
    title: 'CoinLogos',
    component: CoinLogoComponent,
} as Meta;
export default meta;

export const CoinLogo: StoryObj<CoinLogoProps> = {
    render: ({ symbol, size, type }) => (
        <Center>
            <CoinLogoComponent symbol={symbol} size={size} type={type} />
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
