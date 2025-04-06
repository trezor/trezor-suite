import { useEffect, useState } from 'react';
import {
    Control,
    FieldErrors,
    UseFormGetValues,
    UseFormRegister,
    UseFormSetValue,
} from 'react-hook-form';

import { NetworkSymbol, NetworkType } from '@suite-common/wallet-config';
import { FeeInfo, FormState, PrecomposedTransaction } from '@suite-common/wallet-types';
import { formatNetworkAmount, getFeeUnits, isInteger } from '@suite-common/wallet-utils';
import { Column, Row, Text } from '@trezor/components';
import { PrecomposedTransactionCardano } from '@trezor/connect';
import { spacings } from '@trezor/theme';

import { FiatValue, FormattedCryptoAmount, Translation } from 'src/components/suite';
import { useTranslation } from 'src/hooks/suite';
import { TranslationFunction } from 'src/hooks/suite/useTranslation';

import { CurrentFee } from './CurrentFee';
import { CustomFeeEthereum } from './CustomFeeEthereum';
import { CustomFeeMisc } from './CustomFeeMisc';
import { CustomFeeWrapper } from './CustomFeeWrapper';

export const FEE_PER_UNIT = 'feePerUnit';
export const FEE_LIMIT = 'feeLimit';

export type CustomFeeBasicProps<TFieldValues extends FormState> = {
    networkType: NetworkType;
    feeInfo: FeeInfo;
    errors: FieldErrors<TFieldValues>;
    register: UseFormRegister<TFieldValues>;
    control: Control;
    composedFeePerByte: string;
    setValue: UseFormSetValue<TFieldValues>;
    getValues: UseFormGetValues<TFieldValues>;
    translationString: TranslationFunction;
    feeUnits: string;
    sharedRules: {
        required: string;
        validate: (value: string) => string | undefined;
    };
};

interface CustomFeeProps<TFieldValues extends FormState> {
    networkType: NetworkType;
    symbol: NetworkSymbol;
    feeInfo: FeeInfo;
    errors: FieldErrors<TFieldValues>;
    register: UseFormRegister<TFieldValues>;
    control: Control;
    setValue: UseFormSetValue<TFieldValues>;
    getValues: UseFormGetValues<TFieldValues>;
    transactionInfo?: PrecomposedTransaction | PrecomposedTransactionCardano;
}

export const CustomFee = <TFieldValues extends FormState>({
    networkType,
    symbol,
    feeInfo,
    register,
    control,
    transactionInfo,
    ...props
}: CustomFeeProps<TFieldValues>) => {
    const { translationString } = useTranslation();
    const [cachedNetworkAmount, setCachedNetworkAmount] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (transactionInfo && transactionInfo.type !== 'error' && transactionInfo.fee) {
            setCachedNetworkAmount(formatNetworkAmount(transactionInfo.fee, symbol));
        }
    }, [symbol, transactionInfo]);

    const sharedRules = {
        required: translationString('CUSTOM_FEE_IS_NOT_SET'),
        // Allow decimals in ETH since GWEI is not a satoshi.
        validate: (value: string) => {
            if (['bitcoin', 'ethereum'].includes(networkType) && !isInteger(value)) {
                return translationString('CUSTOM_FEE_IS_NOT_INTEGER');
            }
        },
    };

    const feeUnits = getFeeUnits(networkType);

    return (
        <>
            <CustomFeeWrapper>
                <CurrentFee networkType={networkType} networkSymbol={symbol} feeInfo={feeInfo} />
                {networkType === 'ethereum' ? (
                    <CustomFeeEthereum
                        {...props}
                        networkType={networkType}
                        feeInfo={feeInfo}
                        register={register}
                        control={control}
                        feeUnits={feeUnits}
                        translationString={translationString}
                        sharedRules={sharedRules}
                    />
                ) : (
                    <CustomFeeMisc
                        {...props}
                        networkType={networkType}
                        feeInfo={feeInfo}
                        register={register}
                        control={control}
                        composedFeePerByte={
                            transactionInfo?.type === 'final' ? transactionInfo.feePerByte : ''
                        }
                        feeUnits={feeUnits}
                        translationString={translationString}
                        sharedRules={sharedRules}
                    />
                )}
            </CustomFeeWrapper>
            {cachedNetworkAmount && (
                <Column>
                    <Row gap={spacings.sm} alignItems="baseline" justifyContent="space-between">
                        <Text variant="tertiary" typographyStyle="hint">
                            <Translation id={networkType === 'ethereum' ? 'MAX_FEE' : 'FEE'} />:
                        </Text>

                        <Row gap={spacings.xxs}>
                            <Text variant="default" typographyStyle="hint">
                                <FormattedCryptoAmount
                                    data-testid="@trading/quote/custom-fee-amount"
                                    disableHiddenPlaceholder
                                    value={cachedNetworkAmount}
                                    symbol={symbol}
                                />
                            </Text>
                            <Text variant="tertiary" typographyStyle="hint">
                                <FiatValue
                                    disableHiddenPlaceholder
                                    amount={cachedNetworkAmount}
                                    symbol={symbol}
                                    showApproximationIndicator
                                />
                            </Text>
                        </Row>
                    </Row>
                </Column>
            )}
        </>
    );
};
