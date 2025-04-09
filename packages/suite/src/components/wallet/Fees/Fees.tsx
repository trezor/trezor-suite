import { useEffect, useMemo } from 'react';
import {
    Control,
    FieldErrors,
    UseFormGetValues,
    UseFormRegister,
    UseFormReturn,
    UseFormSetValue,
} from 'react-hook-form';

import { useTheme } from 'styled-components';

import { TranslationKey } from '@suite-common/intl-types';
import { NetworkSymbol, NetworkType } from '@suite-common/wallet-config';
import { updateFeeInfoThunk } from '@suite-common/wallet-core';
import {
    FeeInfo,
    FormState,
    PrecomposedLevels,
    PrecomposedLevelsCardano,
} from '@suite-common/wallet-types';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { Banner, Column, Icon, Link, Row, SelectBar, Tooltip } from '@trezor/components';
import { FeeLevel } from '@trezor/connect';
import { spacings } from '@trezor/theme';
import { HELP_CENTER_TRANSACTION_FEES_URL } from '@trezor/urls';

import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { Account } from 'src/types/wallet';

import { CustomFee } from './CustomFee/CustomFee';
import { StandardFee } from './StandardFee/StandardFee';

export const getFeeLevelTranslationId = (label: FeeLevel['label']): TranslationKey =>
    (
        ({
            custom: 'FEE_LEVEL_ADVANCED',
            high: 'FEE_LEVEL_HIGH',
            normal: 'FEE_LEVEL_NORMAL',
            economy: 'FEE_LEVEL_LOW',
            low: 'FEE_LEVEL_LOW',
        }) as const
    )[label];

export type FeeOptionType = {
    value: FeeLevel['label'];
    blocks?: number;
    feePerUnit?: string;
    networkAmount?: string | null;
    feePerTx?: string; // Solana specific
    // EIP-1559
    maxWaitTimeEstimate?: number;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    baseFeePerGas?: string;
};

export interface FeesProps<TFieldValues extends FormState> {
    account: Pick<Account, 'symbol' | 'networkType'>;
    feeInfo: FeeInfo;
    register: UseFormRegister<TFieldValues>;
    control: Control<any>;
    setValue: UseFormSetValue<TFieldValues>;
    getValues: UseFormGetValues<TFieldValues>;
    errors: FieldErrors<TFieldValues>;
    isDirty: boolean;
    changeFeeLevel: (level: FeeLevel['label']) => void;
    composedLevels?: PrecomposedLevels | PrecomposedLevelsCardano;
    label?: TranslationKey;
    rbfForm?: boolean;
}

const buildFeeOptions = (
    levels: FeeLevel[],
    networkType: NetworkType,
    symbol: NetworkSymbol,
    composedLevels?: PrecomposedLevels | PrecomposedLevelsCardano,
): FeeOptionType[] => {
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
            ...level,
            value: level.label,
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
    isDirty,
    ...props
}: FeesProps<TFieldValues>) => {
    // Type assertion allowing to make the component reusable, see https://stackoverflow.com/a/73624072.
    const { getValues, register, setValue } = props as unknown as UseFormReturn<FormState>;
    const theme = useTheme();
    const dispatch = useDispatch();

    const selectedOption = getValues('selectedFee') || 'normal';
    const isCustomFee = selectedOption === 'custom';
    const errors = props.errors as unknown as FieldErrors<FormState>;

    const error = errors.selectedFee;
    const selectedLevel = feeInfo.levels.find(level => level.label === selectedOption);
    const transactionInfo = composedLevels?.[selectedOption];

    const feeOptions = buildFeeOptions(feeInfo.levels, networkType, symbol, composedLevels);

    const supportsCustomFee = networkType !== 'solana';

    useEffect(() => {
        dispatch(updateFeeInfoThunk({ networkSymbol: symbol }));
    }, [dispatch, symbol]);

    const feeLabelId = useMemo(() => {
        switch (networkType) {
            case 'ethereum':
                return 'MAX_FEE';
            case 'solana':
                return 'TR_TX_FEE_INCLUDING_RENT';
            default:
                return 'FEE';
        }
    }, [networkType]);

    const feeTooltipTextId = useMemo(() => {
        switch (networkType) {
            case 'ethereum':
                return 'TR_EVM_MAX_FEE_DESC';
            case 'solana':
                return 'TR_SOL_FEE_DESC';
            default:
                return 'TR_TRANSACTION_FEE_DESC';
        }
    }, [networkType]);

    return (
        <Column gap={spacings.md}>
            <Row flexWrap="wrap" justifyContent="space-between" gap={spacings.sm}>
                <Tooltip
                    addon={
                        networkType === 'ethereum' && (
                            <Link href={HELP_CENTER_TRANSACTION_FEES_URL} target="_blank">
                                <Icon size={12} color={theme.iconAlertYellow} name="lightbulb" />
                                <Translation id="TR_LEARN" />
                            </Link>
                        )
                    }
                    hasIcon
                    maxWidth={328}
                    content={<Translation id={feeTooltipTextId} values={{ br: <br /> }} />}
                >
                    <Translation id={label ?? feeLabelId} />
                </Tooltip>
                {supportsCustomFee && (
                    <SelectBar
                        orientation="horizontal"
                        selectedOption={isCustomFee ? 'custom' : 'normal'}
                        size="small"
                        options={[
                            {
                                label: <Translation id="FEE_LEVEL_STANDARD" />,
                                value: 'normal',
                            },
                            { label: <Translation id="FEE_LEVEL_ADVANCED" />, value: 'custom' },
                        ]}
                        onChange={() => changeFeeLevel(isCustomFee ? 'normal' : 'custom')}
                    />
                )}
            </Row>

            {!isCustomFee && selectedLevel && (
                <StandardFee
                    networkType={networkType}
                    feeInfo={feeInfo}
                    isDirty={isDirty}
                    selectedLevel={selectedLevel}
                    transactionInfo={transactionInfo}
                    feeOptions={feeOptions}
                    symbol={symbol}
                    changeFeeLevel={changeFeeLevel}
                />
            )}
            {isCustomFee && (
                <CustomFee
                    symbol={symbol}
                    control={control}
                    networkType={networkType}
                    feeInfo={feeInfo}
                    errors={errors}
                    register={register}
                    getValues={getValues}
                    setValue={setValue}
                    transactionInfo={transactionInfo}
                />
            )}
            {error && (
                <Banner icon variant="destructive">
                    {error.message}
                </Banner>
            )}
        </Column>
    );
};
