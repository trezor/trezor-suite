import { useSelector } from 'react-redux';

import { selectIsDeviceInViewOnlyMode, selectIsPortfolioTrackerDevice } from '@suite-common/device';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { Box, Button, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { NoAccountSvg } from './NoAccountSvg';

type NoAccountsComponentProps = {
    symbol: NetworkSymbol;
    onActivateAccount: () => void;
};

const NoAccountDescription = ({
    isPortfolioTrackerDevice,
    isDeviceInViewOnlyMode,
}: {
    isPortfolioTrackerDevice: boolean;
    isDeviceInViewOnlyMode: boolean;
}) => {
    if (isPortfolioTrackerDevice) {
        return (
            <Translation id="moduleTrading.accountScreen.accountEmpty.portfolioTracker.description" />
        );
    }

    if (isDeviceInViewOnlyMode) {
        return <Translation id="moduleTrading.accountScreen.accountEmpty.viewOnly.description" />;
    }

    return (
        <Translation id="moduleTrading.accountScreen.accountEmpty.networkNotEnabled.noAccountDescription" />
    );
};

export const NoAccountsComponent = ({ symbol, onActivateAccount }: NoAccountsComponentProps) => {
    const isDeviceInViewOnlyMode = useSelector(selectIsDeviceInViewOnlyMode);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);

    const isActivationAvailable = !isDeviceInViewOnlyMode && !isPortfolioTrackerDevice;

    return (
        <VStack flex={1} justifyContent="space-between" paddingTop="sp32" spacing="sp32">
            <Box flex={1} justifyContent="center" alignItems="center">
                <NoAccountSvg />
            </Box>
            <VStack spacing="sp32">
                <VStack spacing="sp12">
                    <Text variant="headline-md">
                        <Translation id="moduleTrading.accountScreen.accountEmpty.title" />
                    </Text>
                    <Text variant="body-md" color="contentSecondary">
                        <NoAccountDescription
                            isPortfolioTrackerDevice={isPortfolioTrackerDevice}
                            isDeviceInViewOnlyMode={isDeviceInViewOnlyMode}
                        />
                    </Text>
                </VStack>
                {isActivationAvailable && (
                    <Button onPress={onActivateAccount}>
                        <Translation
                            id="moduleTrading.accountScreen.accountEmpty.activate"
                            values={{ network: getNetwork(symbol).name }}
                        />
                    </Button>
                )}
            </VStack>
        </VStack>
    );
};
