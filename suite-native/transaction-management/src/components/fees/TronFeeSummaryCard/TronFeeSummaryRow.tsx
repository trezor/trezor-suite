import { type NetworkSymbol, type NetworkType } from '@suite-common/wallet-config';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';

import { FeeLabelTranslation } from '../FeeLabelTranslation';
import { TronFeeValue } from './TronFeeValue';

export type TronFeeSummaryRowProps = {
    symbol: NetworkSymbol;
    networkType: NetworkType;
    supportsAdjustableFees: boolean;
    trxBurned: string | null;
    areFeesLoading: boolean;
    resourceLabel: string;
};

export const TronFeeSummaryRow = ({
    symbol,
    networkType,
    supportsAdjustableFees,
    trxBurned,
    areFeesLoading,
    resourceLabel,
}: TronFeeSummaryRowProps) => {
    const hasResourceCoverage = !!resourceLabel;

    return (
        <HStack
            justifyContent="space-between"
            alignItems="center"
            paddingHorizontal="sp16"
            paddingVertical="sp12"
        >
            <VStack spacing="sp4">
                <Text variant="body-sm" color="contentSecondary">
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
    );
};
