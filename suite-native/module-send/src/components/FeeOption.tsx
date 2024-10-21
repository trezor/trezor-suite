import { useContext } from 'react';
import { Pressable } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    useDerivedValue,
    withTiming,
} from 'react-native-reanimated';

import { getNetworkType, NetworkSymbol } from '@suite-common/wallet-config';
import { AccountKey, GeneralPrecomposedTransactionFinal } from '@suite-common/wallet-types';
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
import { updateDraftFeeLevelThunk } from '../sendFormThunks';

type FeeOptionProps = {
    feeKey: SendFeesFormValues['feeLevel'];
    feeLevel: GeneralPrecomposedTransactionFinal;
    networkSymbol: NetworkSymbol;
    transactionBytes: number;
    accountKey: AccountKey;
    isInteractive?: boolean;
};

const feeLabelsMap = {
    economy: 'moduleSend.fees.levels.low',
    normal: 'moduleSend.fees.levels.normal',
    high: 'moduleSend.fees.levels.high',
} as const satisfies Record<NativeSupportedFeeLevel, TxKeyPath>;

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

export const FeeOption = ({
    feeKey,
    feeLevel,
    networkSymbol,
    transactionBytes,
    accountKey,
    isInteractive = true,
}: FeeOptionProps) => {
    const { utils, applyStyle } = useNativeStyles();
    const { watch, setValue } = useContext(FormContext);
    const dispatch = useDispatch();

    const feeTimeEstimate = useSelector((state: FeesRootState) =>
        selectNetworkFeeLevelTimeEstimate(state, feeKey, networkSymbol),
    );

    const backendFeePerUnit = useSelector((state: FeesRootState) =>
        selectNetworkFeeLevelFeePerUnit(state, feeKey, networkSymbol),
    );

    const areFeeValuesComplete = feeLevel.type === 'final';

    const handleSelectFeeLevel = () => {
        setValue('feeLevel', feeKey, {
            shouldValidate: true,
        });

        analytics.report({ type: EventType.SendFeeLevelChanged, payload: { value: feeKey } });

        dispatch(updateDraftFeeLevelThunk({ accountKey, feeLevel: feeKey }));
    };

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

    // The transaction fee-per-unit values might be different from the ones obtained from the backend
    // (e.g., an account leftover dust might be added to the fee etc.)
    // In case we have values for it, the fee-per-unit is calculated from the transaction values.
    const feePerUnit = areFeeValuesComplete
        ? Math.round(Number(feeLevel.fee) / transactionBytes)
        : Number(backendFeePerUnit);

    const formattedFeePerUnit = `${feePerUnit} ${feeUnits}`;

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
