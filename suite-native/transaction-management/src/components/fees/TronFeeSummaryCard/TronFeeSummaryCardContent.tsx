import { type NetworkSymbol, type NetworkType } from '@suite-common/wallet-config';
import { Card, HStack, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { useNativeStyles } from '@trezor/styles-native';

import { FeeLabelTranslation } from '../FeeLabelTranslation';
import { TronFeeValue } from './TronFeeValue';

type TronFeeSummaryCardContentProps = {
    symbol: NetworkSymbol;
    networkType: NetworkType;
    supportsAdjustableFees: boolean;
    trxBurned: string | null;
    areFeesLoading: boolean;
    resourceLabel: string;
};

export const TronFeeSummaryCardContent = ({
    symbol,
    networkType,
    supportsAdjustableFees,
    trxBurned,
    areFeesLoading,
    resourceLabel,
}: TronFeeSummaryCardContentProps) => {
    const hasResourceCoverage = !!resourceLabel;
    const {
        utils: { spacings },
    } = useNativeStyles();

    return (
        <Card style={{ paddingVertical: spacings.sp12 }}>
            <HStack justifyContent="space-between" alignItems="center">
                <VStack spacing="sp4">
                    <Text variant="body-sm">
                        <FeeLabelTranslation
                            networkType={networkType}
                            supportsAdjustableFees={supportsAdjustableFees}
                        />
                    </Text>
                </VStack>
                <HStack alignItems="center" spacing="sp8">
                    <VStack alignItems="flex-end" spacing="sp2">
                        <TronFeeValue
                            trxBurned={trxBurned}
                            areFeesLoading={areFeesLoading}
                            resourceLabel={resourceLabel}
                            symbol={symbol}
                        />
                        {trxBurned !== null && hasResourceCoverage && !areFeesLoading && (
                            <Text variant="body-sm" color="contentSecondary">
                                {`+ ${resourceLabel}`}
                            </Text>
                        )}
                    </VStack>
                    {supportsAdjustableFees && (
                        <Icon name="caretDown" size="medium" color="contentSecondary" />
                    )}
                </HStack>
            </HStack>
        </Card>
    );
};
