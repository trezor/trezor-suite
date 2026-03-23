import { useContext } from 'react';
import { Pressable } from 'react-native';
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    useDerivedValue,
    withTiming,
} from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { type NetworkSymbol, type NetworkType, getNetworkType } from '@suite-common/wallet-config';
import {
    EVM_FEE_RATE_DECIMALS,
    type FeesRootState,
    selectConvertedNetworkFeeLevelFeePerUnit,
    selectConvertedNetworkFeeLevelTimeEstimate,
} from '@suite-common/wallet-core';
import {
    type GeneralPrecomposedTransaction,
    type GeneralPrecomposedTransactionFinal,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';
import { getFeeUnits, isEip1559 } from '@suite-common/wallet-utils';
import { Box, HStack, Radio, Text, VStack } from '@suite-native/atoms';
import {
    CryptoAmountFormatter,
    CryptoToFiatAmountFormatter,
    EmptyAmountSkeleton,
} from '@suite-native/formatters';
import { FormContext } from '@suite-native/forms';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { type Color } from '@trezor/theme';

import { FeeOptionErrorMessage } from './FeeOptionErrorMessage';
import { type NativeSupportedPredefinedFeeLevel } from '../../../types';

export type FeeOptionProps = {
    feeKey: NativeSupportedPredefinedFeeLevel;
    feeLevel: GeneralPrecomposedTransactionFinal;
    symbol: NetworkSymbol;
    transactionBytes: number;
    isInteractive?: boolean;
    isLoading?: boolean;
    onSelectedFeeLevel?: (feeKey: NativeSupportedPredefinedFeeLevel) => void;
};

const feeLabelsMap = {
    low: 'transactionManagement.fees.levels.low',
    economy: 'transactionManagement.fees.levels.low',
    normal: 'transactionManagement.fees.levels.normal',
    high: 'transactionManagement.fees.levels.high',
} as const satisfies Record<NativeSupportedPredefinedFeeLevel, TxKeyPath>;

const wrapperStyle = prepareNativeStyle(utils => ({
    overflow: 'hidden',
    borderRadius: utils.borders.radii.r16,
    borderWidth: utils.borders.widths.large,
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderColor: utils.colors.backgroundSurfaceElevation0,
}));

const valuesWrapperStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.sp16,
}));

const getFeePerUnit = ({
    networkType,
    feeLevel,
    transactionBytes,
    backendFeePerUnit = '0',
}: {
    networkType: NetworkType;
    feeLevel: GeneralPrecomposedTransaction;
    transactionBytes: number;
    backendFeePerUnit: string;
}): string => {
    if (!isFinalPrecomposedTransaction(feeLevel)) {
        return backendFeePerUnit;
    }

    if (networkType === 'ethereum') {
        const value = Number(isEip1559(feeLevel) ? feeLevel.maxFeePerGas : feeLevel.feePerByte);

        return value.toFixed(EVM_FEE_RATE_DECIMALS);
    }

    if (networkType === 'bitcoin') {
        const feePerVb = Number(feeLevel.fee) / transactionBytes;

        return Number.isInteger(feePerVb) ? String(feePerVb) : Number(feePerVb).toFixed(2);
    }

    return feeLevel.feePerByte;
};

export const FeeOption = ({
    feeKey,
    feeLevel,
    symbol,
    transactionBytes,
    isInteractive = true,
    isLoading = false,
    onSelectedFeeLevel,
}: FeeOptionProps) => {
    const { utils, applyStyle } = useNativeStyles();
    const { watch, setValue } = useContext(FormContext);

    const feeTimeEstimate = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeLevelTimeEstimate(state, symbol, feeKey),
    );

    const backendFeePerUnit = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeLevelFeePerUnit(state, symbol, feeKey),
    );

    const areFeeValuesComplete = isFinalPrecomposedTransaction(feeLevel);

    const selectedLevel = watch('feeLevel');
    const isChecked = selectedLevel === feeKey;

    const highlightColor: Color = areFeeValuesComplete
        ? 'backgroundSecondaryDefault'
        : 'backgroundAlertRedBold';

    const borderAnimationValue = useDerivedValue(
        () => (isChecked ? withTiming(1) : withTiming(0)),
        [isChecked],
    );

    const animatedCardStyle = useAnimatedStyle(
        () => ({
            borderColor: interpolateColor(
                isInteractive ? borderAnimationValue.value : 0,
                [0, 1],
                [utils.colors.backgroundSurfaceElevation0, utils.colors[highlightColor]],
            ),
        }),
        [borderAnimationValue, highlightColor, isInteractive],
    );

    const label = feeLabelsMap[feeKey];
    const networkType = getNetworkType(symbol);
    const feeUnits = getFeeUnits(networkType);

    // If trezor-connect was not able to compose the fee level (e.g. insufficient account balance), we have to mock its value.
    const fee = areFeeValuesComplete
        ? feeLevel.fee
        : String(transactionBytes * Number(backendFeePerUnit));

    const feePerUnit = getFeePerUnit({
        networkType,
        feeLevel,
        transactionBytes,
        backendFeePerUnit: backendFeePerUnit ?? '0',
    });

    const formattedFeePerUnit = `${feePerUnit} ${feeUnits}`;

    const handleSelectFeeLevel = () => {
        if (feeKey === selectedLevel) return;

        setValue('feeLevel', feeKey, { shouldValidate: true, shouldDirty: true });
        onSelectedFeeLevel?.(feeKey);

        // Update custom fee form so user sees current values when switching to Custom tab.
        setValue('customFeePerUnit', feePerUnit, { shouldValidate: true, shouldDirty: true });
        if (feeLevel.feeLimit !== undefined) {
            setValue('customFeeLimit', feeLevel.feeLimit, {
                shouldValidate: true,
                shouldDirty: true,
            });
        }
    };

    return (
        <Pressable
            onPress={handleSelectFeeLevel}
            disabled={!isInteractive}
            testID={`@transactionManagement/fees-level-container-${feeKey}`}
        >
            <Animated.View style={[applyStyle(wrapperStyle), animatedCardStyle]}>
                <Box style={applyStyle(valuesWrapperStyle)}>
                    <HStack
                        spacing="sp24"
                        justifyContent="space-between"
                        flex={1}
                        alignItems="center"
                    >
                        <VStack alignItems="flex-start" spacing="sp4">
                            <Box alignItems="center" flexDirection="row">
                                <Text variant="body-md-strong">
                                    <Translation id={label} />
                                    {' • '}
                                </Text>
                                <Text variant="body-sm" color="textSubdued">
                                    {isLoading ? (
                                        <EmptyAmountSkeleton variant="body-sm" />
                                    ) : (
                                        formattedFeePerUnit
                                    )}
                                </Text>
                            </Box>
                            <Text variant="body-sm" color="textSubdued">
                                {isLoading ? (
                                    <EmptyAmountSkeleton variant="body-sm" />
                                ) : (
                                    `~ ${feeTimeEstimate}`
                                )}
                            </Text>
                        </VStack>
                        <VStack flex={1} alignItems="flex-end" spacing="sp4">
                            <CryptoToFiatAmountFormatter
                                variant="body-md"
                                color="textDefault"
                                value={fee}
                                symbol={symbol}
                                isLoading={isLoading}
                                isDiscreetText={false}
                            />
                            <CryptoAmountFormatter
                                variant="body-sm"
                                color="textSubdued"
                                value={fee}
                                symbol={symbol}
                                isBalance={false}
                                adjustsFontSizeToFit
                                numberOfLines={1}
                                isLoading={isLoading}
                                isDiscreetText={false}
                            />
                        </VStack>
                        {isInteractive && (
                            <Radio
                                isChecked={isChecked}
                                value={feeKey}
                                activeColor={
                                    areFeeValuesComplete
                                        ? 'backgroundPrimaryDefault'
                                        : 'iconAlertRed'
                                }
                                onPress={handleSelectFeeLevel}
                                testID={`@transactionManagement/fees-level-radio-${feeKey}`}
                            />
                        )}
                    </HStack>
                </Box>

                {!areFeeValuesComplete && <FeeOptionErrorMessage isVisible={isChecked} />}
            </Animated.View>
        </Pressable>
    );
};
