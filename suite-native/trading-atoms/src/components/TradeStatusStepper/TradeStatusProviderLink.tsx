import { Box, HStack, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { ProviderLogo } from '../ProviderLogo';
import { TradeStatusSubItem } from './TradeStatusSubItem';

const providerStatusLinkTextStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
}));

type TradeStatusProviderLinkProps = {
    logo?: string;
    statusUrl?: string;
    providerName: string;
};

export const TradeStatusProviderLink = ({
    logo,
    providerName,
    statusUrl,
}: TradeStatusProviderLinkProps) => {
    const { applyStyle } = useNativeStyles();
    const isStatusUrlAvailable = !!statusUrl;
    const providerLogo = logo ? <ProviderLogo logo={logo} size="body-sm" /> : null;

    if (!isStatusUrlAvailable) {
        return (
            <TradeStatusSubItem
                label={
                    <Translation id="moduleTrading.tradeHistory.detail.statusStepper.provider.label" />
                }
                value={
                    <HStack alignItems="center">
                        {providerLogo}
                        <Text variant="body-sm" color="contentSecondary">
                            {providerName}
                        </Text>
                    </HStack>
                }
            />
        );
    }

    return (
        <HStack spacing="sp8" alignItems="center">
            {!!logo && <ProviderLogo logo={logo} size="body-sm" />}
            <Box flexShrink={1}>
                <Link
                    href={statusUrl}
                    externalIconName="arrowSquareOut"
                    isUnderlined
                    textVariant="body-sm"
                    showExternalIcon
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={applyStyle(providerStatusLinkTextStyle)}
                    label={
                        <Translation
                            id="moduleTrading.tradeHistory.detail.statusStepper.provider.checkStatus"
                            values={{ providerName }}
                        />
                    }
                />
            </Box>
        </HStack>
    );
};
