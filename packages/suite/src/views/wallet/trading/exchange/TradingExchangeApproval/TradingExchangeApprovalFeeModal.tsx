import { useLayoutEffect } from 'react';
import { FormProvider } from 'react-hook-form';

import { type Account } from '@suite-common/wallet-types';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { useCurrentRef } from '@trezor/react-utils';

import {
    type AllowanceFeeValues,
    getAllowanceFeeValues,
    setAllowanceFeeValues,
} from './allowanceFeeValues';
import { useAllowanceCompose } from '../../../../../components/wallet/Allowance/hooks/useAllowanceCompose';
import { useFeesContextValue } from '../../../../../components/wallet/Fees/context/useFeesContextValue';
import { TradingExchangeNetworkFeeModalLayout } from '../TradingExchangeNetworkFeeModal/TradingExchangeNetworkFeeModalLayout';

type TradingExchangeApprovalFeeModalProps = {
    account: Account;
    token: TokenInfo;
    tokenContractAddress: string;
    spender: string;
    allowanceAmount: string;
    defaultFeeValues: AllowanceFeeValues;
    onConfirm: (feeValues: AllowanceFeeValues) => void;
    onClose: () => void;
};

export const TradingExchangeApprovalFeeModal = ({
    account,
    token,
    tokenContractAddress,
    spender,
    allowanceAmount,
    defaultFeeValues,
    onConfirm,
    onClose,
}: TradingExchangeApprovalFeeModalProps) => {
    const {
        feeInfo,
        isComposing,
        composedLevels,
        selectedFee,
        composeRequest,
        methods,
        changeFeeLevel,
    } = useAllowanceCompose({
        account,
        contract: tokenContractAddress,
        spender,
        amount: allowanceAmount,
        token,
    });

    const fees = useFeesContextValue({
        account,
        control: methods.control,
        feeInfo,
        composedLevels,
        changeFeeLevel,
        isComposing,
    });

    const openingRef = useCurrentRef({ methods, defaultFeeValues, composeRequest });

    useLayoutEffect(() => {
        const { current } = openingRef;
        setAllowanceFeeValues(current.methods, current.defaultFeeValues);
        current.composeRequest();
    }, [openingRef]);

    const composedLevel = composedLevels?.[selectedFee];
    const isConfirmDisabled = isComposing || composedLevel?.type !== 'final';

    const onConfirmClick = () => {
        onConfirm(getAllowanceFeeValues(methods));
        onClose();
    };

    return (
        <FormProvider {...methods}>
            <TradingExchangeNetworkFeeModalLayout
                account={account}
                fees={fees}
                isConfirmDisabled={isConfirmDisabled}
                onConfirm={onConfirmClick}
                onClose={onClose}
            />
        </FormProvider>
    );
};
