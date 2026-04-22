import { FormProvider } from 'react-hook-form';

import { Context } from '@suite-common/message-system';
import { Column } from '@trezor/components';

import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useMessageSystemYield } from 'src/hooks/suite/useMessageSystemYield';

import { YieldSupplyForm } from './YieldSupplyForm';
import { useYieldSupply } from './useYieldSupply';
import { YieldSupplyContext } from './useYieldSupplyContext';
import { YieldDisabledBanner } from '../common/YieldDisabledBanner';

export const YieldSupply = () => {
    const { isDisabled, content } = useMessageSystemYield('supply');
    const yieldSupplyContextValues = useYieldSupply();

    if (!yieldSupplyContextValues) {
        return null;
    }

    return (
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
    );
};
