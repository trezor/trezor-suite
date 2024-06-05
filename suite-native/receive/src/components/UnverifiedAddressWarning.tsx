import { useSelector } from 'react-redux';

import { Box, Text, PictogramTitleHeader, TrezorSuiteLiteHeader } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { selectIsPortfolioTrackerDevice } from '@suite-common/wallet-core';

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
        <Box marginVertical="medium" paddingHorizontal="medium" paddingVertical="extraLarge">
            <PictogramTitleHeader
                variant="yellow"
                icon="warningTriangleLight"
                title={pictogramContent[pictogramContentKey].title}
                subtitle={pictogramContent[pictogramContentKey].subtitle}
            />
        </Box>
    );
};
