import { type Meta, type StoryObj } from '@storybook/react';

import { isNetworkIconSymbol, networkIconSymbolMap } from '@suite-common/icons/src/iconUtils';
import { Column, Grid, Paragraph } from '@trezor/components';

import { NetworkIcon, allowedNetworkIconSizes } from './NetworkIcon';

const meta: Meta<typeof NetworkIcon> = {
    title: 'NetworkIcon',
    component: NetworkIcon,
};
export default meta;

export const All: StoryObj = {
    render: () => (
        <Grid
            columns="repeat(auto-fit, minmax(120px, 1fr))"
            columnGap={16}
            rowGap={48}
            padding={{ vertical: 32 }}
        >
            {Object.keys(networkIconSymbolMap).map(networkSymbol => (
                <Column key={networkSymbol} justifyContent="center" alignItems="center" gap={12}>
                    {isNetworkIconSymbol(networkSymbol) && (
                        <NetworkIcon networkSymbol={networkSymbol} size={40} />
                    )}
                    <Paragraph intent="neutral" priority="secondary" isMonospaced>
                        {networkSymbol}
                    </Paragraph>
                </Column>
            ))}
        </Grid>
    ),
};

export const Single: StoryObj<typeof NetworkIcon> = {
    args: {
        networkSymbol: 'btc',
        size: 64,
    },
    argTypes: {
        size: {
            options: allowedNetworkIconSizes,
            control: { type: 'select' },
        },
    },
};
