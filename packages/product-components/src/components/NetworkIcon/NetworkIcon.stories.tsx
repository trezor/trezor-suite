import { type Meta, type StoryObj } from '@storybook/react';
import styled from 'styled-components';

import { Column, H2, Paragraph, StoryColumn } from '@trezor/components';

import { NetworkIcon } from './NetworkIcon';
import { NETWORK_ICONS, isNetworkSymbolWithIcon } from '../../constants/networks';

const WrapperIcons = styled.div`
    display: grid;
    width: 100%;
    gap: 5px;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
`;

const meta: Meta<typeof NetworkIcon> = {
    title: 'NetworkIcon',
    component: NetworkIcon,
};
export default meta;

export const All: StoryObj = {
    render: () => (
        <StoryColumn minWidth={700}>
            <H2 margin={{ bottom: 2 }}>Network Icons</H2>
            <Paragraph>All available network SVG icons</Paragraph>
            <WrapperIcons>
                {Object.keys(NETWORK_ICONS).map(networkSymbol => (
                    <Column
                        key={networkSymbol}
                        minHeight={100}
                        justifyContent="center"
                        alignItems="center"
                    >
                        <Paragraph margin={{ bottom: 8 }} intent="neutral" priority="secondary">
                            {networkSymbol}
                        </Paragraph>
                        {isNetworkSymbolWithIcon(networkSymbol) && (
                            <NetworkIcon networkSymbol={networkSymbol} size={32} />
                        )}
                    </Column>
                ))}
            </WrapperIcons>
        </StoryColumn>
    ),
};

export const Single: StoryObj<typeof NetworkIcon> = {
    args: {
        networkSymbol: 'btc',
        size: 32,
    },
};
