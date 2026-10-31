import { type ReactNode, useEffect } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import type { AccountKey, FormState, GeneralPrecomposedLevels } from '@suite-common/wallet-types';

import { CustomFeeContent } from './CustomFeeContent';
import { useCustomFee } from '../../../hooks/fees/useCustomFee';

export type CustomFeeTabContentProps = {
    accountKey: AccountKey;
    symbol: NetworkSymbol;
    formDraft: FormState | null | undefined;
    onFeeLevelsChange: (feeLevels: GeneralPrecomposedLevels | undefined) => void;
    onSubmittableChange: (isSubmittable: boolean) => void;
};

export const CustomFeeTabContent = ({
    accountKey,
    symbol,
    formDraft,
    onSubmittableChange,
    onFeeLevelsChange,
}: CustomFeeTabContentProps): ReactNode => {
    const { feeValue, isFeeLoading, errorMessage, isSubmittable, feeLevels } = useCustomFee({
        accountKey,
        formState: formDraft,
    });

    useEffect(() => {
        onSubmittableChange(isSubmittable);
        onFeeLevelsChange(feeLevels);
    }, [isSubmittable, onSubmittableChange, onFeeLevelsChange, feeLevels]);

    return (
        <CustomFeeContent
            symbol={symbol}
            feeValue={feeValue}
            isFeeLoading={isFeeLoading}
            errorMessage={errorMessage}
        />
    );
};
