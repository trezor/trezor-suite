import { type ReactNode, useEffect } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import type { AccountKey, FormState, GeneralPrecomposedLevels } from '@suite-common/wallet-types';

import { CustomFeeContent } from './CustomFeeContent';
import { type CustomFeeLevelBuilder, useCustomFee } from '../../../hooks/fees/useCustomFee';

export type CustomFeeTabContentProps = {
    accountKey: AccountKey;
    symbol: NetworkSymbol;
    formDraft: FormState | null | undefined;
    getCustomFeeLevel?: CustomFeeLevelBuilder;
    onFeeLevelsChange: (feeLevels: GeneralPrecomposedLevels | undefined) => void;
    onSubmittableChange: (isSubmittable: boolean) => void;
};

export const CustomFeeTabContent = ({
    accountKey,
    symbol,
    formDraft,
    getCustomFeeLevel,
    onSubmittableChange,
    onFeeLevelsChange,
}: CustomFeeTabContentProps): ReactNode => {
    const { feeValue, isFeeLoading, errorMessage, isSubmittable, feeLevels } = useCustomFee({
        accountKey,
        formState: formDraft,
        getCustomFeeLevel,
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
