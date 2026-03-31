import { FormProvider } from 'react-hook-form';

import { type EarnParams } from '@suite/router';
import { Context } from '@suite-common/message-system';
import { type Account } from '@suite-common/wallet-types';
import { Column } from '@trezor/components';

import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useMessageSystemYield } from 'src/hooks/suite/useMessageSystemYield';
import { useAllowance } from 'src/hooks/wallet/allowance/useAllowance';
import { AllowanceContext } from 'src/hooks/wallet/allowance/useAllowanceContext';

import { YieldWithdrawForm } from './YieldWithdrawForm';
import { useYieldWithdraw } from './useYieldWithdraw';
import { YieldWithdrawContext } from './useYieldWithdrawContext';
import { YieldDisabledBanner } from '../common/YieldDisabledBanner';

type YieldWithdrawProps = {
    account: Account;
    routeParams: EarnParams;
};

export const YieldWithdraw = ({ account, routeParams }: YieldWithdrawProps) => {
    const { isDisabled, content } = useMessageSystemYield('withdraw');
    const allowanceContextValue = useAllowance({ account });
    const yieldWithdrawContextValues = useYieldWithdraw({ account, routeParams });

    if (!yieldWithdrawContextValues) {
        return null;
    }

    return (
        <AllowanceContext.Provider value={allowanceContextValue}>
            <Column gap={24}>
                <ContextMessage context={Context.getEarnYield('withdraw')} />
                {isDisabled ? (
                    <YieldDisabledBanner type="withdraw" content={content} />
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
