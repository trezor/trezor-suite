import { Box, HStack, TextButton } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';

import { ProviderDisplay } from '../ProviderDisplay';
import { ProviderLogo } from '../ProviderLogo';
import { TradeStatusSubItem } from './TradeStatusSubItem';

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
    const openLink = useOpenLink();
    const isStatusUrlAvailable = !!statusUrl;

    if (!isStatusUrlAvailable) {
        return (
            <TradeStatusSubItem
                label={
                    <Translation id="moduleTrading.tradeHistory.detail.statusStepper.provider.label" />
                }
                value={
                    <ProviderDisplay
                        color="contentSecondary"
                        logo={logo}
                        providerName={providerName}
                    />
                }
            />
        );
    }

    return (
        <HStack spacing="sp8" alignItems="center">
            {!!logo && <ProviderLogo logo={logo} size="body-sm" />}
            <Box flexShrink={1}>
                <TextButton
                    size="small"
                    intent="brand"
                    isUnderlined
                    iconRight="arrowSquareOut"
                    onPress={() => openLink(statusUrl)}
                >
                    <Translation
                        id="moduleTrading.tradeHistory.detail.statusStepper.provider.checkStatus"
                        values={{ providerName }}
                    />
                </TextButton>
            </Box>
        </HStack>
    );
};
