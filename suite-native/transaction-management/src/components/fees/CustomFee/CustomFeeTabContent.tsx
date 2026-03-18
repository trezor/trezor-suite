import { type ReactNode, useEffect } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey, type FormState } from '@suite-common/wallet-types';

import { CustomFeeContent } from './CustomFeeContent';
import { useCustomFee } from '../../../hooks/fees/useCustomFee';

export type CustomFeeTabContentProps = {
    accountKey: AccountKey;
    symbol: NetworkSymbol;
    formDraft: FormState | null | undefined;
    onSubmittableChange: (isSubmittable: boolean) => void;
};

export const CustomFeeTabContent = ({
    accountKey,
    symbol,
    formDraft,
    onSubmittableChange,
}: CustomFeeTabContentProps): ReactNode => {
    const { feeValue, isFeeLoading, isErrorBoxVisible, isSubmittable } = useCustomFee({
        accountKey,
        formState: formDraft,
    });

    useEffect(() => {
        onSubmittableChange(isSubmittable);
    }, [isSubmittable, onSubmittableChange]);

    return (
        <CustomFeeContent
            symbol={symbol}
            feeValue={feeValue}
            isFeeLoading={isFeeLoading}
            isErrorBoxVisible={isErrorBoxVisible}
        />
    );
};
