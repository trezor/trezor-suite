import { memo } from 'react';
import { useSelector } from 'react-redux';

import { Box, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { selectDeviceHistoryIgnoredNetworksString } from '../homescreenSelectors';

const IgnoredNetworksBannerComponent = () => {
    const networksString = useSelector(selectDeviceHistoryIgnoredNetworksString);

    if (networksString === null) {
        return null;
    }

    return (
        <Box paddingHorizontal="sp16">
            <Text textAlign="center" variant="body-sm" color="contentSecondary">
                <Translation id="moduleHome.graphIgnoredNetworks" values={{ networksString }} />
            </Text>
        </Box>
    );
};

export const IgnoredNetworksBanner = memo(IgnoredNetworksBannerComponent);
