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

import { YieldDepositForm } from './YieldDepositForm';
import { useYieldDeposit } from './useYieldDeposit';
import { YieldDepositContext } from './useYieldDepositContext';
import { YieldDisabledBanner } from '../common/YieldDisabledBanner';

type YieldDepositProps = {
    account: Account;
    vault: YieldDtoV2;
};

export const YieldDeposit = ({ account, vault }: YieldDepositProps) => {
    const allowanceContextValue = useAllowance({ account });
    const yieldDepositContextValues = useYieldDeposit({ account, vault });
    const vaultContractAddress = yieldDepositContextValues
        ? getYieldVaultContractAddress(yieldDepositContextValues.vault)
        : undefined;
    const { isDisabled, content, variant } = useMessageSystemYield('deposit', {
        vaultContractAddress,
    });

    if (!yieldDepositContextValues) {
        return null;
    }

    // Every step — the allowance read, the approval, the deposit calldata — needs this address,
    // so without it the flow can only fail, and even the allowance retry never succeeds.
    const hasVaultTokenContract = !!yieldDepositContextValues.token.contractAddress;

    return (
        <AllowanceContext.Provider value={allowanceContextValue}>
            <Column gap={24}>
                <ContextMessage context={Context.getEarnYield('deposit')} />
                {isDisabled || !hasVaultTokenContract ? (
                    <YieldDisabledBanner
                        type="deposit"
                        content={isDisabled ? content : undefined}
                        variant={isDisabled ? variant : undefined}
                    />
                ) : (
                    <YieldDepositContext.Provider value={yieldDepositContextValues}>
                        <FormProvider {...yieldDepositContextValues.methods}>
                            <YieldDepositForm />
                        </FormProvider>
                    </YieldDepositContext.Provider>
                )}
            </Column>
        </AllowanceContext.Provider>
    );
};
