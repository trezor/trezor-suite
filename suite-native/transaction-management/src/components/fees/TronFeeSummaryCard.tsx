import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import {
    type AccountsRootState,
    type FeesRootState,
    selectAccountByKey,
    selectAreFeesLoading,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { calculateTronFeeBreakdown } from '@suite-common/wallet-utils';
import { AnimatedPressable, Card, HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';
import { useTranslate } from '@suite-native/intl';

import { FeeLabelTranslation } from './FeeLabelTranslation';
import { selectFeeLevels } from '../../selectors';
import { type NativeSendRootState } from '../../sendFormSlice';

type TronFeeSummaryCardProps = {
    accountKey: AccountKey;
    onPress?: () => void;
    testID?: string;
    feeLimitSunOverride?: string;
    supportsAdjustableFees?: boolean;
};

export const TronFeeSummaryCard = ({
    accountKey,
    onPress,
    testID,
    feeLimitSunOverride,
    supportsAdjustableFees,
}: TronFeeSummaryCardProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const feeLevels = useSelector((state: NativeSendRootState) => selectFeeLevels(state));
    const areFeesLoading = useSelector((state: FeesRootState) =>
        selectAreFeesLoading(state, account?.symbol),
    );
    const { translate } = useTranslate();

    if (!account || account.networkType !== 'tron') return null;

    const normalLevel = feeLevels.normal;
    const tronResources = account.misc?.tronResources;
    const breakdown = calculateTronFeeBreakdown(
        normalLevel,
        tronResources,
        account.symbol,
        feeLimitSunOverride,
    );

    const trxBurned =
        breakdown !== null && !breakdown.trxBurned.isZero() ? breakdown.trxBurned.toString() : null;

    const resourceParts: string[] = [];
    if (breakdown?.coveredEnergy.gt(0)) {
        resourceParts.push(
            translate('moduleSend.fees.tron.energyCount', {
                count: breakdown.coveredEnergy.toFixed(0),
            }),
        );
    }
    if (breakdown?.coveredBandwidth.gt(0)) {
        resourceParts.push(
            translate('moduleSend.fees.tron.bandwidthCount', {
                count: breakdown.coveredBandwidth.toFixed(0),
            }),
        );
    }
    const resourceLabel = resourceParts.join(' & ');
    const hasResourceCoverage = resourceParts.length > 0;

    const renderFeeValue = () => {
        if (trxBurned !== null) {
            return (
                <HStack alignItems="center" spacing="sp4">
                    <CryptoAmountFormatter
                        variant="body-sm"
                        color="textDefault"
                        value={trxBurned}
                        symbol={account.symbol}
                        isBalance
                        isLoading={areFeesLoading}
                        isDiscreetText={false}
                        testID="@transactionManagement/tron-fee-crypto-amount"
                    />
                    {!areFeesLoading && (
                        <Text variant="body-sm" color="textDefault">
                            ≈
                        </Text>
                    )}
                    <CryptoToFiatAmountFormatter
                        variant="body-sm"
                        color="textDefault"
                        value={trxBurned}
                        symbol={account.symbol}
                        isBalance
                        isLoading={areFeesLoading}
                        isDiscreetText={false}
                    />
                </HStack>
            );
        }

        if (hasResourceCoverage) {
            if (areFeesLoading) {
                return (
                    <CryptoAmountFormatter
                        variant="body-sm"
                        color="textDefault"
                        value={null}
                        symbol={account.symbol}
                        isBalance
                        isLoading
                        isDiscreetText={false}
                    />
                );
            }

            return (
                <Text variant="body-sm" color="textDefault">
                    {resourceLabel}
                </Text>
            );
        }

        return (
            <CryptoAmountFormatter
                variant="body-sm"
                color="textDefault"
                value={null}
                symbol={account.symbol}
                isBalance
                isLoading
                isDiscreetText={false}
                testID="@transactionManagement/tron-fee-crypto-amount"
            />
        );
    };

    const cardContent = (
        <Card>
            <HStack justifyContent="space-between" alignItems="center">
                <VStack spacing="sp4">
                    <Text variant="body-sm">
                        <FeeLabelTranslation
                            networkType="tron"
                            supportsAdjustableFees={supportsAdjustableFees}
                        />
                    </Text>
                </VStack>
                <HStack alignItems="center" spacing="sp8">
                    <VStack alignItems="flex-end" spacing="sp2">
                        {renderFeeValue()}
                        {trxBurned !== null && hasResourceCoverage && !areFeesLoading && (
                            <Text variant="body-sm" color="textSubdued">
                                {`+ ${resourceLabel}`}
                            </Text>
                        )}
                    </VStack>
                    {onPress && <Icon name="caretDown" size="medium" color="iconSubdued" />}
                </HStack>
            </HStack>
        </Card>
    );

    if (onPress) {
        return (
            <AnimatedPressable
                exiting={FadeOut}
                entering={FadeIn}
                onPress={onPress}
                testID={testID}
            >
                {cardContent}
            </AnimatedPressable>
        );
    }

    return (
        <Animated.View entering={FadeIn} exiting={FadeOut} testID={testID}>
            {cardContent}
        </Animated.View>
    );
};
