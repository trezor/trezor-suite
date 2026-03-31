import { FormProvider } from 'react-hook-form';

import { Context } from '@suite-common/message-system';
import { type EarnParams } from '@suite/router';
import { type Account } from '@suite-common/wallet-types';
import { Column } from '@trezor/components';

import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useMessageSystemYield } from 'src/hooks/suite/useMessageSystemYield';
import { useAllowance } from 'src/hooks/wallet/allowance/useAllowance';
import { AllowanceContext } from 'src/hooks/wallet/allowance/useAllowanceContext';

import { YieldSupplyForm } from './YieldSupplyForm';
import { useYieldSupply } from './useYieldSupply';
import { YieldSupplyContext } from './useYieldSupplyContext';
import { YieldDisabledBanner } from '../common/YieldDisabledBanner';

type YieldSupplyProps = {
    account: Account;
    routeParams: EarnParams;
};

export const YieldSupply = ({ account, routeParams }: YieldSupplyProps) => {
    const { isDisabled, content } = useMessageSystemYield('supply');
    const allowanceContextValue = useAllowance({ account });
    const yieldSupplyContextValues = useYieldSupply({ account, routeParams });

    if (!yieldSupplyContextValues) {
        return null;
    }

    return (
        <AllowanceContext.Provider value={allowanceContextValue}>
            <Column gap={24}>
                <ContextMessage context={Context.getEarnYield('supply')} />
                {isDisabled ? (
                    <YieldDisabledBanner type="supply" content={content} />
                ) : (
                    <YieldSupplyContext.Provider value={yieldSupplyContextValues}>
                        <FormProvider {...yieldSupplyContextValues.methods}>
                            <YieldSupplyForm />
                        </FormProvider>
                    </YieldSupplyContext.Provider>
                )}
            </Column>
        </AllowanceContext.Provider>
    );
};
