import { useSelector } from 'react-redux';

import { Screen, ScreenSubHeader } from '@suite-native/navigation';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    BtcOnlyCoinEnablingContent,
    DiscoveryCoinsFilter,
    useCoinEnabling,
} from '@suite-native/coin-enabling';
import { Box, Text } from '@suite-native/atoms';
import { selectIsBitcoinOnlyDevice } from '@suite-common/wallet-core';

export const SettingsCoinEnablingScreen = () => {
    const { translate } = useTranslate();
    const { availableNetworks } = useCoinEnabling();
    const isBitcoinOnlyDevice = useSelector(selectIsBitcoinOnlyDevice);

    const showBtcOnly = availableNetworks.length === 1 && isBitcoinOnlyDevice;

    return (
        <Screen
            screenHeader={
                <ScreenSubHeader
                    content={translate('moduleSettings.coinEnabling.settings.title')}
                />
            }
        >
            {showBtcOnly ? ( //testnets can be enabled and we want to show the switcher in that case
                <BtcOnlyCoinEnablingContent />
            ) : (
                <Box paddingHorizontal="small">
                    <Box alignItems="center" paddingBottom="extraLarge">
                        <Text textAlign="center" color="textSubdued">
                            <Translation id="moduleSettings.coinEnabling.settings.subtitle" />
                        </Text>
                    </Box>
                    <DiscoveryCoinsFilter />
                </Box>
            )}
        </Screen>
    );
};
