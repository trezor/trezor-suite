import {
    Control,
    FieldErrors,
    UseFormGetValues,
    UseFormRegister,
    UseFormReturn,
    UseFormSetValue,
} from 'react-hook-form';

import styled from 'styled-components';

import { TranslationKey } from '@suite-common/intl-types';
import { NetworkSymbol, NetworkType } from '@suite-common/wallet-config';
import {
    FeeInfo,
    FormState,
    PrecomposedLevels,
    PrecomposedLevelsCardano,
    PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { Banner, Column, InfoItem, Note, Row, SelectBar, Text, Tooltip } from '@trezor/components';
import { FeeLevel } from '@trezor/connect';
import { spacings, spacingsPx } from '@trezor/theme';

import { FiatValue, FormattedCryptoAmount, Translation } from 'src/components/suite';
import { Account } from 'src/types/wallet';

import { CustomFee } from './CustomFee';
import { FeeDetails } from './FeeDetails';

const FEE_LEVELS_TRANSLATIONS: Record<FeeLevel['label'], TranslationKey> = {
    custom: 'FEE_LEVEL_ADVANCED',
    high: 'FEE_LEVEL_HIGH',
    normal: 'FEE_LEVEL_NORMAL',
    economy: 'FEE_LEVEL_LOW',
    low: 'FEE_LEVEL_LOW',
} as const;

export type FeeOption = {
    label: React.ReactNode;
    value: FeeLevel['label'];
    blocks?: number;
    feePerUnit?: string;
    networkAmount?: string | null;
    feePerTx?: string;
};

const SelectBarWrapper = styled.div`
    justify-self: end;
    margin-top: ${spacingsPx.xs};
`;

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
    label?: TranslationKey;
    rbfForm?: boolean;
    helperText?: React.ReactNode;
}

const buildFeeOptions = (
    levels: FeeLevel[],
    networkType: NetworkType,
    symbol: NetworkSymbol,
    composedLevels?: PrecomposedLevels | PrecomposedLevelsCardano,
) => {
    const filteredLevels = levels.filter(level => level.label !== 'custom');

    const getNetworkAmount = (level: FeeLevel) => {
        const transactionInfo = composedLevels?.[level.label];
        const hasTransactionInfo =
            transactionInfo !== undefined && transactionInfo.type !== 'error';
        const networkAmount = hasTransactionInfo
            ? formatNetworkAmount(transactionInfo.fee, symbol)
            : null;
        // Needed only for Solana because of fee estimation on compose Tx
        const fee = hasTransactionInfo ? transactionInfo.fee : level.feePerTx;

        return { networkAmount, fee };
    };

    const buildBasicFeeOptions = (level: FeeLevel) => {
        const { networkAmount } = getNetworkAmount(level);

        return {
            label: <Translation id={FEE_LEVELS_TRANSLATIONS[level.label]} />,
            value: level.label,
            feePerUnit: level.feePerUnit,
            networkAmount,
        };
    };

    switch (networkType) {
        case 'solana':
            return filteredLevels.map(level => {
                const { fee } = getNetworkAmount(level);
                const basicFeeOption = buildBasicFeeOptions(level);

                return {
                    ...basicFeeOption,
                    feePerTx: fee,
                };
            });
        case 'ethereum':
            // legacy fee format
            return filteredLevels.map(level => buildBasicFeeOptions(level));
        case 'bitcoin':
            return filteredLevels.map(level => {
                const basicFeeOption = buildBasicFeeOptions(level);

                return {
                    ...basicFeeOption,
                    blocks: level.blocks,
                };
            });
        default:
            return filteredLevels.map(level => buildBasicFeeOptions(level));
    }
};

export const Fees = <TFieldValues extends FormState>({
    account: { symbol, networkType },
    feeInfo,
    control,
    changeFeeLevel,
    composedLevels,
    label,
    rbfForm,
    helperText,
    ...props
}: FeesProps<TFieldValues>) => {
    // Type assertion allowing to make the component reusable, see https://stackoverflow.com/a/73624072.
    const { getValues, register, setValue } = props as unknown as UseFormReturn<FormState>;

    const selectedOption = getValues('selectedFee') || 'normal';
    const isCustomFee = selectedOption === 'custom';
    const errors = props.errors as unknown as FieldErrors<FormState>;

    const error = errors.selectedFee;
    const selectedLevel = feeInfo.levels.find(level => level.label === selectedOption)!;
    const transactionInfo = composedLevels?.[selectedOption];

    const feeOptions = buildFeeOptions(feeInfo.levels, networkType, symbol, composedLevels);

    const hasTransactionInfo = transactionInfo !== undefined && transactionInfo.type !== 'error';
    const networkAmount = hasTransactionInfo
        ? formatNetworkAmount(transactionInfo.fee, symbol)
        : null;

    const supportsCustomFee = networkType !== 'solana';

    return (
        <Column gap={spacings.md}>
            <Row flexWrap="wrap">
                <Row flex="1">
                    <InfoItem
                        direction="row"
                        typographyStyle="body"
                        verticalAlignment="bottom"
                        label={
                            <Row gap={spacings.xs}>
                                <Tooltip
                                    dashed
                                    maxWidth={328}
                                    content={
                                        networkType === 'ethereum' ? (
                                            <Translation id="TR_EVM_MAX_FEE_DESC" />
                                        ) : (
                                            <Translation id="TR_TRANSACTION_FEE_DESC" />
                                        )
                                    }
                                >
                                    <Text variant="default">
                                        <Translation
                                            id={
                                                label ??
                                                (networkType === 'ethereum' ? 'MAX_FEE' : 'FEE')
                                            }
                                        />
                                    </Text>
                                </Tooltip>
                            </Row>
                        }
                    />
                </Row>
                {supportsCustomFee && (
                    <SelectBarWrapper>
                        <SelectBar
                            orientation="horizontal"
                            selectedOption={isCustomFee ? 'custom' : 'normal'}
                            options={[
                                { label: <Translation id="FEE_LEVEL_STANDARD" />, value: 'normal' },
                                { label: <Translation id="FEE_LEVEL_ADVANCED" />, value: 'custom' },
                            ]}
                            onChange={() => changeFeeLevel(isCustomFee ? 'normal' : 'custom')}
                            isFullWidth
                        />
                    </SelectBarWrapper>
                )}
            </Row>

            {!isCustomFee && (
                <FeeDetails
                    networkType={networkType}
                    feeInfo={feeInfo}
                    selectedLevel={selectedLevel}
                    transactionInfo={transactionInfo}
                    showFee={true}
                    feeOptions={feeOptions}
                    symbol={symbol}
                    changeFeeLevel={changeFeeLevel}
                />
            )}

            {isCustomFee && (
                <>
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
                    <Column>
                        <Row gap={spacings.sm} alignItems="baseline" justifyContent="space-between">
                            <Text variant="tertiary" typographyStyle="hint">
                                <Translation id="FEE" />:
                            </Text>
                            {networkAmount && (
                                <Row gap={spacings.xxs}>
                                    <Text variant="default" typographyStyle="hint">
                                        <FormattedCryptoAmount
                                            disableHiddenPlaceholder
                                            value={networkAmount}
                                            symbol={symbol}
                                        />
                                    </Text>
                                    <Text variant="tertiary" typographyStyle="hint">
                                        <FiatValue
                                            disableHiddenPlaceholder
                                            amount={networkAmount}
                                            symbol={symbol}
                                            showApproximationIndicator
                                        />
                                    </Text>
                                </Row>
                            )}
                        </Row>
                    </Column>
                </>
            )}
            {error && (
                <Banner icon variant="destructive">
                    {error.message}
                </Banner>
            )}

            {helperText && <Note>{helperText}</Note>}
        </Column>
    );
};
