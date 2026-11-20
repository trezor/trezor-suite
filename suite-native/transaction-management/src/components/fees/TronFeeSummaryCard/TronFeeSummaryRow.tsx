import { type NetworkSymbol, type NetworkType } from '@suite-common/wallet-config';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';

import { FeeLabelTranslation } from '../FeeLabelTranslation';
import { TronFeeInfoButton } from './TronFeeInfoButton';
import { TronFeeValue } from './TronFeeValue';

export type TronFeeSummaryRowProps = {
    symbol: NetworkSymbol;
    networkType: NetworkType;
    supportsAdjustableFees: boolean;
    trxBurned: string | null;
    areFeesLoading: boolean;
    resourceParts: string[];
    hasComposeError: boolean;
    isAccountActivation: boolean;
};

export const TronFeeSummaryRow = ({
    symbol,
    networkType,
    supportsAdjustableFees,
    trxBurned,
    areFeesLoading,
    resourceParts,
    hasComposeError,
    isAccountActivation,
}: TronFeeSummaryRowProps) => {
    const hasResourceCoverage = resourceParts.length > 0;

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
                {!hasComposeError && (
                    <VStack alignItems="flex-end" spacing="sp2">
                        <TronFeeValue
                            trxBurned={trxBurned}
                            areFeesLoading={areFeesLoading}
                            resourceParts={resourceParts}
                            symbol={symbol}
                        />
                        {trxBurned !== null &&
                            hasResourceCoverage &&
                            !areFeesLoading &&
                            resourceParts.map(part => (
                                <Text key={part} variant="body-sm" color="contentSecondary">
                                    {`+ ${part}`}
                                </Text>
                            ))}
                    </VStack>
                )}
                <TronFeeInfoButton isAccountActivation={isAccountActivation} />
                {supportsAdjustableFees && (
                    <Icon name="caretDown" size="medium" color="contentSecondary" />
                )}
            </HStack>
        </HStack>
    );
};
