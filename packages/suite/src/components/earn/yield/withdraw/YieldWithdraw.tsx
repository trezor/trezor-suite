import { FormProvider } from 'react-hook-form';

import { ContextMessage } from '@suite/message-system';
import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { Context } from '@suite-common/message-system';
import { getYieldVaultContractAddress } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Column } from '@trezor/components';

import { useMessageSystemYield } from 'src/hooks/suite/useMessageSystemYield';
import { useAllowance } from 'src/hooks/wallet/allowance/useAllowance';
import { AllowanceContext } from 'src/hooks/wallet/allowance/useAllowanceContext';

import { YieldWithdrawForm } from './YieldWithdrawForm';
import { useYieldWithdraw } from './useYieldWithdraw';
import { YieldWithdrawContext } from './useYieldWithdrawContext';
import { YieldDisabledBanner } from '../common/YieldDisabledBanner';

type YieldWithdrawProps = {
    account: Account;
    vault: YieldDtoV2;
};

export const YieldWithdraw = ({ account, vault }: YieldWithdrawProps) => {
    const allowanceContextValue = useAllowance({ account });
    const yieldWithdrawContextValues = useYieldWithdraw({ account, vault });
    const vaultContractAddress = yieldWithdrawContextValues
        ? getYieldVaultContractAddress(yieldWithdrawContextValues.vault)
        : undefined;
    const { isDisabled, content, variant } = useMessageSystemYield('withdraw', {
        vaultContractAddress,
    });

    if (!yieldWithdrawContextValues) {
        return null;
    }

    // A flow that is already signing or has broadcast keeps its form, so the pending transaction
    // and the completion stay visible after the feature is disabled remotely.
    const isFormHidden = isDisabled && !yieldWithdrawContextValues.hasTransactionActivity;

    return (
        <AllowanceContext.Provider value={allowanceContextValue}>
            <Column gap={24}>
                <ContextMessage context={Context.getEarnYield('withdraw')} />
                {isFormHidden ? (
                    <YieldDisabledBanner type="withdraw" content={content} variant={variant} />
                ) : (
                    <YieldWithdrawContext.Provider value={yieldWithdrawContextValues}>
                        <FormProvider {...yieldWithdrawContextValues.methods}>
                            <YieldWithdrawForm />
                        </FormProvider>
                    </YieldWithdrawContext.Provider>
                )}
            </Column>
        </AllowanceContext.Provider>
    );
};
