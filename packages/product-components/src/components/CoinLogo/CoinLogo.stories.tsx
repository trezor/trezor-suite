import { Meta, StoryObj } from '@storybook/react';
import styled from 'styled-components';

import { CoinLogoProps } from './CoinLogo';
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
            options: Object.keys(COINS),
            control: {
                type: 'select',
            },
        },
    },
};
