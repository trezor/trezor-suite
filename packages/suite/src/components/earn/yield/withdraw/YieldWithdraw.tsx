import { FormProvider } from 'react-hook-form';

import { Context } from '@suite-common/message-system';
import { Column } from '@trezor/components';

import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useMessageSystemYield } from 'src/hooks/suite/useMessageSystemYield';

import { YieldWithdrawForm } from './YieldWithdrawForm';
import { useYieldWithdraw } from './useYieldWithdraw';
import { YieldWithdrawContext } from './useYieldWithdrawContext';
import { YieldDisabledBanner } from '../common/YieldDisabledBanner';

export const YieldWithdraw = () => {
    const { isDisabled, content } = useMessageSystemYield('withdraw');
    const yieldWithdrawContextValues = useYieldWithdraw();

    if (!yieldWithdrawContextValues) {
        return null;
    }

    return (
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
    );
};
