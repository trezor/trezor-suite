import { useSelector } from 'react-redux';

import { selectIsPortfolioTrackerDevice } from '@suite-common/wallet-core';
import { Box, PictogramTitleHeader, Text, TrezorSuiteLiteHeader } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

const pictogramContent = {
    portfolioTracker: {
        title: (
            <Text>
                <TrezorSuiteLiteHeader />
                {'\n'}
                <Text variant="titleSmall">
                    <Translation id="moduleReceive.receiveAddressCard.unverifiedWarning.portfolioTracker.title" />
                </Text>
            </Text>
        ),
        subtitle: (
            <Translation id="moduleReceive.receiveAddressCard.unverifiedWarning.portfolioTracker.subtitle" />
        ),
    },
    viewOnly: {
        title: (
            <Text variant="titleSmall">
                <Translation id="moduleReceive.receiveAddressCard.unverifiedWarning.viewOnly.title" />
            </Text>
        ),
        subtitle: (
            <Translation id="moduleReceive.receiveAddressCard.unverifiedWarning.viewOnly.subtitle" />
        ),
    },
};

export const UnverifiedAddressWarning = () => {
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);

    const pictogramContentKey = isPortfolioTrackerDevice ? 'portfolioTracker' : 'viewOnly';

    return (
        <Box marginVertical="sp16" paddingHorizontal="sp16" paddingVertical="sp32">
            <PictogramTitleHeader
                variant="warning"
                title={pictogramContent[pictogramContentKey].title}
                subtitle={pictogramContent[pictogramContentKey].subtitle}
            />
        </Box>
    );
};
