import {
    type NetworkSymbol,
    getNetworkDisplaySymbol,
    getNetworkDisplaySymbolName,
} from '@suite-common/wallet-config';
import { InlineAlertBox, Text, VStack } from '@suite-native/atoms';
import { CryptoIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

type HowStakeWorksHeaderSectionProps = {
    symbol: NetworkSymbol;
    totalStakedAmount: string;
};

export const HowStakeWorksHeaderSection = ({
    symbol,
    totalStakedAmount,
}: HowStakeWorksHeaderSectionProps) => {
    const displaySymbol = getNetworkDisplaySymbol(symbol);
    const networkName = getNetworkDisplaySymbolName(symbol);

    return (
        <VStack spacing="sp24" paddingTop="sp16">
            <VStack justifyContent="flex-start" alignItems="flex-start" spacing={0}>
                <Text variant="headline-md">
                    <Translation id="earn.howStakeWorksScreen.title" values={{ displaySymbol }} />
                </Text>
                <Text variant="body-sm" color="textSubdued">
                    <Translation id="earn.howStakeWorksScreen.subtitle" values={{ networkName }} />
                </Text>
            </VStack>
            <InlineAlertBox
                variant="neutral"
                viewLeft={<CryptoIcon symbol={symbol} size="extraSmall" />}
                title={
                    <Translation
                        id="earn.howStakeWorksScreen.infoBannerTitle"
                        values={{
                            totalStakedAmount,
                            b: chunks => <Text variant="body-sm-strong">{chunks}</Text>,
                        }}
                    />
                }
            />
        </VStack>
    );
};
