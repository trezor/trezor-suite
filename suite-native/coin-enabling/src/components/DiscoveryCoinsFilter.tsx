import { useSelector } from 'react-redux';

import { selectIsDeviceConnected } from '@suite-common/device';
import { type Network, type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { Switch, Text, VStack } from '@suite-native/atoms';
import { selectDiscoveryNetworkGroups } from '@suite-native/discovery';
import { useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { useToast } from '@suite-native/toasts';

import { NetworkListItem } from './NetworkListItem';

type NetworkGroupProps = {
    networks: Network[];
    enabledSymbols: NetworkSymbol[];
    handleToggle: (symbol: NetworkSymbol) => void;
    showTestnetsLabel?: boolean;
};

type DiscoveryCoinsFilterProps = {
    onDisablingLastCoin?: () => void;
};

const NetworkGroup = ({
    networks,
    enabledSymbols,
    handleToggle,
    showTestnetsLabel,
}: NetworkGroupProps) => (
    <VStack spacing="sp12">
        {showTestnetsLabel && (
            <Text variant="body-sm">
                <Translation id="moduleSettings.coinEnabling.testnetsLabel" />
            </Text>
        )}
        {networks.map(({ symbol }) => (
            <NetworkListItem
                key={symbol}
                symbol={symbol}
                accessory={
                    <Switch
                        isChecked={enabledSymbols.includes(symbol)}
                        onChange={() => handleToggle(symbol)}
                    />
                }
                onPress={() => handleToggle(symbol)}
                accessibilityRole="togglebutton"
                testID={`@coin-enabling/toggle-${symbol}`}
            />
        ))}
    </VStack>
);

export const DiscoveryCoinsFilter = ({ onDisablingLastCoin }: DiscoveryCoinsFilterProps) => {
    const { supportedMainnets, supportedTestnets, unsupportedMainnets, unsupportedTestnets } =
        useSelector(selectDiscoveryNetworkGroups);
    const isDeviceConnected = useSelector(selectIsDeviceConnected);
    const { showToast } = useToast();

    const { setValue, watch } = useFormContext();
    const enabledSymbols: NetworkSymbol[] = watch('enabledCoins');

    const handleToggle = (symbol: NetworkSymbol) => {
        const isEnabled = !enabledSymbols.includes(symbol);

        if (
            !isEnabled &&
            onDisablingLastCoin &&
            enabledSymbols.length === 1 &&
            enabledSymbols.includes(symbol)
        ) {
            onDisablingLastCoin();

            return;
        }

        if (!isDeviceConnected && isEnabled) {
            const { name } = getNetwork(symbol);
            showToast({
                intent: 'neutral',
                message: (
                    <Translation
                        id="moduleSettings.coinEnabling.toasts.coinEnabled"
                        values={{ coin: name }}
                    />
                ),
            });
        }

        const newEnabledSymbols = isEnabled
            ? [...enabledSymbols, symbol]
            : enabledSymbols.filter(s => s !== symbol);

        setValue('enabledCoins', newEnabledSymbols, { shouldDirty: true, shouldValidate: true });
    };

    return (
        <VStack spacing="sp32">
            <VStack spacing="sp24">
                <NetworkGroup
                    networks={supportedMainnets}
                    enabledSymbols={enabledSymbols}
                    handleToggle={handleToggle}
                />
                {supportedTestnets.length > 0 && (
                    <NetworkGroup
                        networks={supportedTestnets}
                        enabledSymbols={enabledSymbols}
                        handleToggle={handleToggle}
                        showTestnetsLabel
                    />
                )}
            </VStack>
            {unsupportedMainnets.length > 0 && (
                <VStack spacing="sp16">
                    <Text variant="headline-sm">
                        <Translation id="moduleSettings.coinEnabling.unsupportedSubtitle" />
                    </Text>
                    <VStack spacing="sp24">
                        <NetworkGroup
                            networks={unsupportedMainnets}
                            enabledSymbols={enabledSymbols}
                            handleToggle={handleToggle}
                        />
                        {unsupportedTestnets.length > 0 && (
                            <NetworkGroup
                                networks={unsupportedTestnets}
                                enabledSymbols={enabledSymbols}
                                handleToggle={handleToggle}
                                showTestnetsLabel
                            />
                        )}
                    </VStack>
                </VStack>
            )}
        </VStack>
    );
};
