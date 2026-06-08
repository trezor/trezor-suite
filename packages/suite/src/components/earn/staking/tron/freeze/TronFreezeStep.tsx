import { FormProvider } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { Banner, Card, Column, Divider } from '@trezor/components';

import { Fees } from 'src/components/wallet/Fees/Fees';

import { useTronStakeContext } from '../TronStakeContext';
import { TronFreezeAmount } from './TronFreezeAmount';
import { TronFreezePendingTransaction } from './TronFreezePendingTransaction';
import { TronFreezeResourceSelect } from './TronFreezeResourceSelect';
import { TronFreezeSubmitButton } from './TronFreezeSubmitButton';
import { useTronStakeFees } from '../hooks/useTronStakeFees';

export const TronFreezeStep = () => {
    const { account, form, actions } = useTronStakeContext();
    const { error } = actions;
    const { feeInfo, composedLevels } = useTronStakeFees({ account });

    return (
        <FormProvider {...form.methods}>
            <Column gap={16}>
                <Card paddingType="none">
                    <Column gap={16} padding={{ vertical: 16, horizontal: 20 }}>
                        <TronFreezeAmount />
                        <Divider margin={{ top: 0, bottom: 0 }} />
                        <TronFreezeResourceSelect />
                    </Column>
                </Card>

                <Card paddingType="none">
                    <Column padding={{ vertical: 16, horizontal: 20 }}>
                        <Fees
                            account={account}
                            feeInfo={feeInfo}
                            composedLevels={composedLevels}
                            changeFeeLevel={() => {}}
                        />
                    </Column>
                </Card>

                {error && (
                    <Banner
                        intent="warning"
                        description={<Translation id="TR_EARN_TRON_SUBMIT_ERROR" />}
                    />
                )}

                <TronFreezeSubmitButton />

                <TronFreezePendingTransaction />
            </Column>
        </FormProvider>
    );
};
