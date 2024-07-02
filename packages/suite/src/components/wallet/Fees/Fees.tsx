import styled from 'styled-components';
import { FeeLevel } from '@trezor/connect';
import {
    Control,
    FieldErrors,
    UseFormGetValues,
    UseFormRegister,
    UseFormReturn,
    UseFormSetValue,
} from 'react-hook-form';
import { Icon, Paragraph, SelectBar, Tooltip, motionEasing, variables } from '@trezor/components';
import { FormState } from '@suite-common/wallet-types';
import { spacingsPx, typography } from '@trezor/theme';
import { FiatValue, FormattedCryptoAmount, Translation } from 'src/components/suite';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { Account } from 'src/types/wallet';
import { ExtendedMessageDescriptor } from 'src/types/suite';
import {
    FeeInfo,
    PrecomposedLevels,
    PrecomposedLevelsCardano,
    PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { CustomFee } from './CustomFee';
import { FeeDetails } from './FeeDetails';
import { AnimatePresence, motion } from 'framer-motion';
import { TranslationKey } from '@suite-common/intl-types';

const Container = styled.div`
    overflow: hidden; /* prevent scrollbar when custom fee is opened */
    width: 100%;
`;

const FiatAmount = styled(FiatValue)`
    color: ${({ theme }) => theme.textSubdued};
`;

const FeeInfoRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: start;
    width: 100%;
    min-height: 52px; /* reserve space for fiat/crypto amounts */
`;

const FeeAmount = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    gap: ${spacingsPx.xxs};
`;

const FeeError = styled.div`
    width: 100%;
    padding-top: ${spacingsPx.xxs};
    color: ${({ theme }) => theme.textAlertRed};
    ${typography.label}
    text-align: right;
`;

const Label = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: ${spacingsPx.xxs};
`;

const HeadingWrapper = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    gap: ${spacingsPx.xxs};
    text-transform: capitalize;
`;

const StyledSelectBar = styled(SelectBar<FeeLevel['label']>)`
    margin-top: ${spacingsPx.lg};
`;

const HelperTextWrapper = styled(Paragraph)`
    color: ${({ theme }) => theme.textSubdued};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

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

    return (
        <Container>
            <FeeInfoRow>
                <Label>
                    <HeadingWrapper>
                        <Translation
                            id={label || (networkType === 'ethereum' ? 'MAX_FEE' : 'FEE')}
                        />
                        {networkType === 'ethereum' && (
                            <Tooltip
                                maxWidth={328}
                                content={<Translation id="TR_STAKE_MAX_FEE_DESC" />}
                            >
                                {/* TODO: Add new info icon. Export from Figma isn't handled as is it should by the strokes to fills online converter */}
                                <Icon icon="INFO" size={14} />
                            </Tooltip>
                        )}
                    </HeadingWrapper>
                    {helperText && <HelperTextWrapper>{helperText}</HelperTextWrapper>}
                </Label>

                {transactionInfo !== undefined && transactionInfo.type !== 'error' && (
                    <FeeAmount>
                        <FormattedCryptoAmount
                            disableHiddenPlaceholder
                            value={formatNetworkAmount(transactionInfo.fee, symbol)}
                            symbol={symbol}
                        />

                        <FiatAmount
                            disableHiddenPlaceholder
                            amount={formatNetworkAmount(transactionInfo.fee, symbol)}
                            symbol={symbol}
                        />
                    </FeeAmount>
                )}
            </FeeInfoRow>

            {feeOptions.length > 0 && (
                <StyledSelectBar
                    selectedOption={selectedOption}
                    options={feeOptions}
                    onChange={changeFeeLevel}
                    isFullWidth
                />
            )}

            <AnimatePresence>
                {!isCustomLevel && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 20 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
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
                            showFee={showFeeWhilePending || transactionInfo?.type === 'final'}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {isCustomLevel && (
                    <CustomFee
                        control={control}
                        networkType={networkType}
                        feeInfo={feeInfo}
                        errors={errors}
                        register={register}
                        getValues={getValues}
                        setValue={setValue}
                        composedFeePerByte={
                            (transactionInfo as PrecomposedTransactionFinal)?.feePerByte
                        }
                    />
                )}
            </AnimatePresence>

            {error && <FeeError>{error.message}</FeeError>}
        </Container>
    );
};
