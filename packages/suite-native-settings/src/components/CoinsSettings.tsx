import { Box, Chip } from '@suite-native/atoms';
import { CryptoIcon, CryptoIconName } from '@trezor/icons';
import * as React from 'react';
import { SettingsSection } from './SettingsSection';

const dummyCoins: { title: string; iconName: CryptoIconName; description?: string }[] = [
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
        description: 'inc. Tokens',
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
        <SettingsSection
            title="Coins"
            subtitle="2 coins active, 1000 tokens active"
            rightIconName="settings"
            onRightIconPress={() => console.log('coin select')}
        >
            <Box flexDirection="row" flexWrap="wrap" alignItems="center">
                {dummyCoins.map(item => (
                    <Box marginRight="small" marginBottom="small" key={item.title}>
                        <Chip
                            icon={<CryptoIcon name={item.iconName} />}
                            description={item.description}
                            title={item.title}
                            onSelect={handleCoinSelect}
                        />
                    </Box>
                ))}
            </Box>
        </SettingsSection>
    );
};
