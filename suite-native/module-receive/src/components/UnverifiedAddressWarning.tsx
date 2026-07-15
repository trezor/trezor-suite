import { useSelector } from 'react-redux';

import { selectIsPortfolioTrackerDevice } from '@suite-common/device';
import { Box, PictogramTitleHeader, Text, TrezorSuiteHeader } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

const pictogramContent = {
    portfolioTracker: {
        title: (
            <Text textAlign="center">
                <TrezorSuiteHeader />
                {'\n'}
                <Text variant="headline-sm" textAlign="center">
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
            <Text variant="headline-sm" textAlign="center">
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
