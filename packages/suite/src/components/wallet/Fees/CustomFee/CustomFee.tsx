import {
    Control,
    FieldErrors,
    UseFormGetValues,
    UseFormRegister,
    UseFormSetValue,
} from 'react-hook-form';

import { NetworkSymbol, NetworkType } from '@suite-common/wallet-config';
import { FeeInfo, FormState } from '@suite-common/wallet-types';
import { getFeeUnits, isInteger } from '@suite-common/wallet-utils';

import { useSelector, useTranslation } from 'src/hooks/suite';
import { TranslationFunction } from 'src/hooks/suite/useTranslation';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';

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
    setValue: UseFormSetValue<TFieldValues>;
    getValues: UseFormGetValues<TFieldValues>;
    composedFeePerByte: string;
    locale: string;
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
    composedFeePerByte: string;
}

export const CustomFee = <TFieldValues extends FormState>({
    networkType,
    symbol,
    feeInfo,
    register,
    control,
    composedFeePerByte,
    ...props
}: CustomFeeProps<TFieldValues>) => {
    const { translationString } = useTranslation();

    const sharedRules = {
        required: translationString('CUSTOM_FEE_IS_NOT_SET'),
        // Allow decimals in ETH since GWEI is not a satoshi.
        validate: (value: string) => {
            if (['bitcoin', 'ethereum'].includes(networkType) && !isInteger(value)) {
                return translationString('CUSTOM_FEE_IS_NOT_INTEGER');
            }
        },
    };

    const locale = useSelector(selectLanguage);

    const getCurrentFee = () => {
        const { levels } = feeInfo;
        const middleIndex = Math.floor((levels.length - 1) / 2);

        return levels[middleIndex].feePerUnit;
    };

    const feeIconName = networkType === 'ethereum' ? 'gasPump' : 'receipt';
    const feeUnits = getFeeUnits(networkType);

    return (
        <CustomFeeWrapper>
            <CurrentFee
                networkType={networkType}
                feeIconName={feeIconName}
                currentFee={getCurrentFee()}
                symbol={symbol}
            />
            {networkType === 'ethereum' ? (
                <CustomFeeEthereum
                    {...props}
                    networkType={networkType}
                    feeInfo={feeInfo}
                    register={register}
                    control={control}
                    composedFeePerByte={composedFeePerByte}
                    feeUnits={feeUnits}
                    translationString={translationString}
                    locale={locale}
                    sharedRules={sharedRules}
                />
            ) : (
                <CustomFeeMisc
                    {...props}
                    networkType={networkType}
                    feeInfo={feeInfo}
                    register={register}
                    control={control}
                    composedFeePerByte={composedFeePerByte}
                    feeUnits={feeUnits}
                    translationString={translationString}
                    locale={locale}
                    sharedRules={sharedRules}
                />
            )}
        </CustomFeeWrapper>
    );
};
