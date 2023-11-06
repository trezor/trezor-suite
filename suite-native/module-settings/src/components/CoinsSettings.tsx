import { Box, Chip } from '@suite-native/atoms';
import { CryptoIcon, CryptoIconName } from '@suite-common/icons';

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

export const CoinsSettings = () => (
    <SettingsSection
        title="Coins"
        subtitle="2 coins active, 1000 tokens active"
        rightIconName="settings"
        onRightIconPress={() => console.warn('coin select')}
    >
        <Box flexDirection="row" flexWrap="wrap" alignItems="center">
            {dummyCoins.map(item => (
                <Box marginRight="s" marginBottom="s" key={item.title}>
                    <Chip
                        icon={<CryptoIcon symbol={item.iconName} />}
                        description={item.description}
                        title={item.title}
                        onSelect={() => {}}
                    />
                </Box>
            ))}
        </Box>
    </SettingsSection>
);
