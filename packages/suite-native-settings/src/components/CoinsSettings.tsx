// @flow
import { Box, Chip } from '@suite-native/atoms';
import { CryptoIcon, CryptoIconName, Icon } from '@trezor/icons';
import * as React from 'react';
import { TouchableOpacity } from 'react-native';
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

const CoinSettingsIcon = () => (
    <TouchableOpacity onPress={() => console.log('coin settings')}>
        <Icon name="settings" />
    </TouchableOpacity>
);

export const CoinsSettings = () => {
    const handleCoinSelect = () => {
        console.log('Coin select');
    };

    return (
        <SettingsSection title="Coins" rightIcon={<CoinSettingsIcon />}>
            <Box flexDirection="row" flexWrap="wrap" alignItems="center">
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
