// @flow
import { Box, Chip } from '@suite-native/atoms';
import { CryptoIcon, CryptoIconName } from '@trezor/icons';
import * as React from 'react';
import { SettingsSection } from './SettingsSection';

const dummyCoins: { title: string; iconName: CryptoIconName }[] = [
    {
        title: 'Bitcoin',
        iconName: 'btc',
    },
    {
        title: 'Litecoin',
        iconName: 'ltc',
    },
    {
        title: 'Ethereum',
        iconName: 'eth',
    },
    {
        title: 'Ethereum Classic',
        iconName: 'eth',
    },
    {
        title: 'XRP',
        iconName: 'ltc',
    },
    {
        title: 'Dash',
        iconName: 'ltc',
    },
    {
        title: 'Bitcoin Cash',
        iconName: 'ltc',
    },
    {
        title: 'Bitcoin Gold',
        iconName: 'ltc',
    },
    {
        title: 'DigiByte',
        iconName: 'ltc',
    },
];

export const CoinsSettings = () => {
    const handleCoinSelect = () => {
        console.log('Coin select');
    };
    return (
        <SettingsSection title="Coins">
            <Box flexDirection="row" flexWrap="wrap">
                {dummyCoins.map(item => (
                    <Chip
                        key={item.title}
                        icon={<CryptoIcon name={item.iconName} />}
                        title={item.title}
                        onSelect={handleCoinSelect}
                    />
                ))}
            </Box>
        </SettingsSection>
    );
};
