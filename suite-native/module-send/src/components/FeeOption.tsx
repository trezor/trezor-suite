import { useContext } from 'react';
import { Pressable } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    useDerivedValue,
    withTiming,
} from 'react-native-reanimated';

import { getNetworkType, NetworkSymbol, NetworkType } from '@suite-common/wallet-config';
import {
    AccountKey,
    GeneralPrecomposedTransaction,
    GeneralPrecomposedTransactionFinal,
    isFinalPrecomposedTransaction,
    TokenAddress,
} from '@suite-common/wallet-types';
import { Text, HStack, VStack, Radio, Box } from '@suite-native/atoms';
import { CryptoToFiatAmountFormatter, CryptoAmountFormatter } from '@suite-native/formatters';
import { FormContext } from '@suite-native/forms';
import { TxKeyPath, Translation } from '@suite-native/intl';
import {
    FeesRootState,
    selectNetworkFeeLevelFeePerUnit,
    selectNetworkFeeLevelTimeEstimate,
} from '@suite-common/wallet-core';
import { Color } from '@trezor/theme';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { getFeeUnits } from '@suite-common/wallet-utils';
import { analytics, EventType } from '@suite-native/analytics';

import { SendFeesFormValues } from '../sendFeesFormSchema';
import { NativeSupportedFeeLevel } from '../types';
import { FeeOptionErrorMessage } from './FeeOptionErrorMessage';
import { updateSelectedFeeLevelThunk } from '../sendFormThunks';

type FeeOptionProps = {
    feeKey: Exclude<SendFeesFormValues['feeLevel'], 'custom'>;
    feeLevel: GeneralPrecomposedTransactionFinal;
    networkSymbol: NetworkSymbol;
    transactionBytes: number;
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    isInteractive?: boolean;
};

const feeLabelsMap = {
    economy: 'moduleSend.fees.levels.low',
    normal: 'moduleSend.fees.levels.normal',
    high: 'moduleSend.fees.levels.high',
} as const satisfies Record<Exclude<NativeSupportedFeeLevel, 'custom'>, TxKeyPath>;

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

    if (networkType === 'bitcoin') {
        return String(Math.round(Number(feeLevel.fee) / transactionBytes));
    }

    return feeLevel.feePerByte;
};

export const FeeOption = ({
    feeKey,
    feeLevel,
    networkSymbol,
    transactionBytes,
    accountKey,
    tokenContract,
    isInteractive = true,
}: FeeOptionProps) => {
    const { utils, applyStyle } = useNativeStyles();
    const { watch, setValue } = useContext(FormContext);
    const dispatch = useDispatch();

    const feeTimeEstimate = useSelector((state: FeesRootState) =>
        selectNetworkFeeLevelTimeEstimate(state, networkSymbol, feeKey),
    );

    const backendFeePerUnit = useSelector((state: FeesRootState) =>
        selectNetworkFeeLevelFeePerUnit(state, networkSymbol, feeKey),
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
    const networkType = getNetworkType(networkSymbol);
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
        setValue('feeLevel', feeKey, {
            shouldValidate: true,
        });
        analytics.report({ type: EventType.SendFeeLevelChanged, payload: { value: feeKey } });
        dispatch(
            updateSelectedFeeLevelThunk({
                accountKey,
                tokenContract,
                feeLevelLabel: feeKey,
            }),
        );

        // Update also custom fee form so user can see the current values there.
        setValue('customFeePerUnit', feePerUnit, {
            shouldValidate: true,
        });
        setValue('customFeeLimit', feeLevel.feeLimit, {
            shouldValidate: true,
        });
    };

    return (
        <Pressable onPress={handleSelectFeeLevel} disabled={!isInteractive}>
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
                                <Text variant="highlight">
                                    <Translation id={label} />
                                    {' • '}
                                </Text>
                                <Text variant="hint" color="textSubdued">
                                    {formattedFeePerUnit}
                                </Text>
                            </Box>
                            <Text variant="hint" color="textSubdued">
                                {`~ ${feeTimeEstimate}`}
                            </Text>
                        </VStack>
                        <VStack flex={1} alignItems="flex-end" spacing="sp4">
                            <CryptoToFiatAmountFormatter
                                variant="body"
                                color="textDefault"
                                value={fee}
                                network={networkSymbol}
                            />
                            <CryptoAmountFormatter
                                variant="hint"
                                color="textSubdued"
                                value={fee}
                                network={networkSymbol}
                                isBalance={false}
                                adjustsFontSizeToFit
                                numberOfLines={1}
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
                                testID={`@send/fees-level-${feeKey}`}
                            />
                        )}
                    </HStack>
                </Box>

                {!areFeeValuesComplete && <FeeOptionErrorMessage isVisible={isChecked} />}
            </Animated.View>
        </Pressable>
    );
};
