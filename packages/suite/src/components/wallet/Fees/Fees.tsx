import {
    Control,
    FieldErrors,
    UseFormGetValues,
    UseFormRegister,
    UseFormReturn,
    UseFormSetValue,
} from 'react-hook-form';

import { AnimatePresence, motion } from 'framer-motion';

import { FeeLevel } from '@trezor/connect';
import {
    Banner,
    SelectBar,
    Tooltip,
    Column,
    Note,
    motionEasing,
    InfoRow,
    Row,
    Text,
} from '@trezor/components';
import {
    FormState,
    FeeInfo,
    PrecomposedLevels,
    PrecomposedLevelsCardano,
    PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { spacings } from '@trezor/theme';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { TranslationKey } from '@suite-common/intl-types';

import { FiatValue, FormattedCryptoAmount, Translation } from 'src/components/suite';
import { Account } from 'src/types/wallet';
import { ExtendedMessageDescriptor } from 'src/types/suite';

import { CustomFee } from './CustomFee';
import { FeeDetails } from './FeeDetails';

const FEE_LEVELS_TRANSLATIONS: Record<FeeLevel['label'], TranslationKey> = {
    custom: 'FEE_LEVEL_CUSTOM',
    high: 'FEE_LEVEL_HIGH',
    normal: 'FEE_LEVEL_NORMAL',
    economy: 'FEE_LEVEL_LOW',
    low: 'FEE_LEVEL_LOW',
} as const;

const buildFeeOptions = (levels: FeeLevel[]) =>
    levels.map(({ label }) => ({
        label: <Translation id={FEE_LEVELS_TRANSLATIONS[label]} />,
        value: label,
    }));

export interface FeesProps<TFieldValues extends FormState> {
    account: Account;
    feeInfo: FeeInfo;
    register: UseFormRegister<TFieldValues>;
    control: Control<any>;
    setValue: UseFormSetValue<TFieldValues>;
    getValues: UseFormGetValues<TFieldValues>;
    errors: FieldErrors<TFieldValues>;
    changeFeeLevel: (level: FeeLevel['label']) => void;
    changeFeeLimit?: (value: string) => void;
    composedLevels?: PrecomposedLevels | PrecomposedLevelsCardano;
    label?: ExtendedMessageDescriptor['id'];
    rbfForm?: boolean;
    helperText?: React.ReactNode;
    showFeeWhilePending?: boolean;
}

export const Fees = <TFieldValues extends FormState>({
    account: { symbol, networkType },
    feeInfo,
    control,
    changeFeeLevel,
    changeFeeLimit,
    composedLevels,
    label,
    rbfForm,
    helperText,
    showFeeWhilePending = true,
    ...props
}: FeesProps<TFieldValues>) => {
    // Type assertion allowing to make the component reusable, see https://stackoverflow.com/a/73624072.
    const { getValues, register, setValue } = props as unknown as UseFormReturn<FormState>;
    const errors = props.errors as unknown as FieldErrors<FormState>;

    const selectedOption = getValues('selectedFee') || 'normal';
    const isCustomLevel = selectedOption === 'custom';

    const error = errors.selectedFee;
    const selectedLevel = feeInfo.levels.find(level => level.label === selectedOption)!;
    const transactionInfo = composedLevels?.[selectedOption];
    // Solana has only `normal` fee level, so we do not display any feeOptions since there is nothing to choose from
    const feeOptions = networkType === 'solana' ? [] : buildFeeOptions(feeInfo.levels);

    const showNormalFee = showFeeWhilePending || transactionInfo?.type === 'final';
    const shouldAnimateNormalFee = showNormalFee && !isCustomLevel;

    return (
        <Column alignItems="stretch" gap={spacings.xs}>
            <InfoRow
                direction="row"
                labelTypographyStyle="body"
                label={
                    networkType === 'ethereum' ? (
                        <Tooltip
                            maxWidth={328}
                            hasIcon
                            content={<Translation id="TR_STAKE_MAX_FEE_DESC" />}
                        >
                            <Translation id={label ?? 'MAX_FEE'} />
                        </Tooltip>
                    ) : (
                        <Translation id={label ?? 'FEE'} />
                    )
                }
            >
                {transactionInfo !== undefined && transactionInfo.type !== 'error' && (
                    <Row gap={spacings.md} alignItems="baseline">
                        <FormattedCryptoAmount
                            disableHiddenPlaceholder
                            value={formatNetworkAmount(transactionInfo.fee, symbol)}
                            symbol={symbol}
                        />
                        <Text variant="tertiary" typographyStyle="label">
                            <FiatValue
                                disableHiddenPlaceholder
                                amount={formatNetworkAmount(transactionInfo.fee, symbol)}
                                symbol={symbol}
                                showApproximationIndicator
                            />
                        </Text>
                    </Row>
                )}
            </InfoRow>

            {feeOptions.length > 0 && (
                <>
                    <SelectBar
                        selectedOption={selectedOption}
                        options={feeOptions}
                        onChange={changeFeeLevel}
                        isFullWidth
                        margin={{ top: spacings.sm }}
                    />
                    <AnimatePresence>
                        {shouldAnimateNormalFee && (
                            <motion.div
                                animate={shouldAnimateNormalFee ? 'open' : 'closed'}
                                variants={{
                                    open: { opacity: 1, height: 'auto', marginTop: 0 },
                                    closed: { opacity: 0, height: 0, marginTop: 0 },
                                }}
                                transition={{
                                    opacity: { duration: 0.15, ease: motionEasing.transition },
                                    height: { duration: 0.2, ease: motionEasing.transition },
                                    marginTop: { duration: 0.25, ease: motionEasing.transition },
                                }}
                            >
                                <FeeDetails
                                    networkType={networkType}
                                    feeInfo={feeInfo}
                                    selectedLevel={selectedLevel}
                                    transactionInfo={transactionInfo}
                                    showFee={showNormalFee}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {isCustomLevel && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                transition={{
                                    opacity: { duration: 0.15, ease: motionEasing.transition },
                                    height: { duration: 0.2, ease: motionEasing.transition },
                                    marginTop: { duration: 0.25, ease: motionEasing.transition },
                                }}
                            >
                                <CustomFee
                                    control={control}
                                    networkType={networkType}
                                    feeInfo={feeInfo}
                                    errors={errors}
                                    register={register}
                                    getValues={getValues}
                                    setValue={setValue}
                                    changeFeeLimit={changeFeeLimit}
                                    composedFeePerByte={
                                        (transactionInfo as PrecomposedTransactionFinal)?.feePerByte
                                    }
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {error && (
                        <Banner icon margin={{ top: spacings.sm }} variant="destructive">
                            {error.message}
                        </Banner>
                    )}

                    {helperText && <Note margin={{ top: spacings.md }}>{helperText}</Note>}
                </>
            )}
        </Column>
    );
};
