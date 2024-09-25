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

const feeLabelsMap = {
    economy: 'moduleSend.fees.levels.low',
    normal: 'moduleSend.fees.levels.medium',
    high: 'moduleSend.fees.levels.high',
} as const satisfies Record<NativeSupportedFeeLevel, TxKeyPath>;

const wrapperStyle = prepareNativeStyle(utils => ({
    overflow: 'hidden',
    borderRadius: utils.borders.radii.medium,
    borderWidth: utils.borders.widths.large,
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderColor: utils.colors.backgroundSurfaceElevation0,
}));

const valuesWrapperStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.medium,
}));

type FeeOptionProps = {
    feeKey: SendFeesFormValues['feeLevel'];
    feeLevel: GeneralPrecomposedTransactionFinal;
    networkSymbol: NetworkSymbol;
    transactionBytes: number;
    accountKey: AccountKey;
};

export const FeeOption = ({
    feeKey,
    feeLevel,
    networkSymbol,
    transactionBytes,
    accountKey,
}: FeeOptionProps) => {
    const { utils } = useNativeStyles();
    const { applyStyle } = useNativeStyles();
    const { watch, setValue } = useContext(FormContext);
    const dispatch = useDispatch();

    const feeTimeEstimate = useSelector((state: FeesRootState) =>
        selectNetworkFeeLevelTimeEstimate(state, feeKey, networkSymbol),
    );

    const feePerUnit = useSelector((state: FeesRootState) =>
        selectNetworkFeeLevelFeePerUnit(state, feeKey, networkSymbol),
    );

    const isErrorFee = feeLevel.type !== 'final';

    const handleSelectFeeLevel = () => {
        setValue('feeLevel', feeKey, {
            shouldValidate: true,
        });

        analytics.report({ type: EventType.SendFeeLevelChanged, payload: { value: feeKey } });

        dispatch(updateDraftFeeLevelThunk({ accountKey, feeLevel: feeKey }));
    };

    const selectedLevel = watch('feeLevel');
    const isChecked = selectedLevel === feeKey;

    const highlightColor: Color = isErrorFee
        ? 'backgroundAlertRedBold'
        : 'backgroundSecondaryDefault';

    const borderAnimationValue = useDerivedValue(
        () => (isChecked ? withTiming(1) : withTiming(0)),
        [isChecked],
    );

    const animatedCardStyle = useAnimatedStyle(
        () => ({
            borderColor: interpolateColor(
                borderAnimationValue.value,
                [0, 1],
                [utils.colors.backgroundSurfaceElevation0, utils.colors[highlightColor]],
            ),
        }),
        [borderAnimationValue, highlightColor],
    );

    const label = feeLabelsMap[feeKey];
    const networkType = getNetworkType(networkSymbol);
    const feeUnits = getFeeUnits(networkType);
    const formattedFeePerUnit = `${feePerUnit} ${feeUnits}`;

    // If trezor-connect was not able to compose the fee level, we have to mock its value.
    const mockedFee = transactionBytes * Number(feePerUnit);
    const fee = isErrorFee ? mockedFee.toString() : feeLevel.fee;

    return (
        <Pressable onPress={handleSelectFeeLevel}>
            <Animated.View
                style={[
                    applyStyle(wrapperStyle, { borderColor: highlightColor }),
                    animatedCardStyle,
                ]}
            >
                <Box style={applyStyle(valuesWrapperStyle)}>
                    <HStack
                        spacing="large"
                        justifyContent="space-between"
                        flex={1}
                        alignItems="center"
                    >
                        <VStack alignItems="flex-start" spacing="extraSmall">
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
                        <VStack flex={1} alignItems="flex-end" spacing="extraSmall">
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
                        <Radio
                            isChecked={isChecked}
                            value={feeKey}
                            activeColor={isErrorFee ? 'iconAlertRed' : 'backgroundPrimaryDefault'}
                            onPress={handleSelectFeeLevel}
                            testID={`@send/fees-level-${feeKey}`}
                        />
                    </HStack>
                </Box>

                {isErrorFee && <FeeOptionErrorMessage isVisible={isChecked} />}
            </Animated.View>
        </Pressable>
    );
};
