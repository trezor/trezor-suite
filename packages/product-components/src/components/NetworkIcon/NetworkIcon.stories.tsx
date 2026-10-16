import { useSelector } from 'react-redux';

import { type Meta, type StoryObj } from '@storybook/react';

import { Column, Grid, Paragraph } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { NetworkIcon, allowedNetworkIconSizes } from './NetworkIcon';
import { selectNetworkOptions } from '../../network-display/networkDisplaySelectors';
import { injectHasNetworkIcon } from '../../services/networkServices';

const meta: Meta<typeof NetworkIcon> = {
    title: 'NetworkIcon',
    component: NetworkIcon,
};
export default meta;

export const All: StoryObj = {
    render: function Render() {
        const networkOptions = useSelector(selectNetworkOptions);
        const { hasNetworkIcon } = useServices(injectHasNetworkIcon);

        return (
            <Grid
                columns="repeat(auto-fit, minmax(120px, 1fr))"
                columnGap={16}
                rowGap={48}
                padding={{ vertical: 32 }}
            >
                {networkOptions.map(({ symbol: networkSymbol }) => (
                    <Column key={networkSymbol} justifyContent="center" alignItems="center" gap={12}>
                        {hasNetworkIcon(networkSymbol) && (
                            <NetworkIcon networkSymbol={networkSymbol} size={40} />
                        )}
                        <Paragraph intent="neutral" priority="secondary" isMonospaced>
                            {networkSymbol}
                        </Paragraph>
                    </Column>
                ))}
            </Grid>
        );
    },
};

export const Single: StoryObj<typeof NetworkIcon> = {
    args: {
        networkSymbol: asNetworkSymbol('btc'),
        size: 64,
    },
    argTypes: {
        size: {
            options: allowedNetworkIconSizes,
            control: { type: 'select' },
        },
    },
};
