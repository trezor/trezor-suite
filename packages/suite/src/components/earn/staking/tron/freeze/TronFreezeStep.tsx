import { FormProvider } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { Banner, Card, Column, Divider } from '@trezor/components';

import { useTronStakeContext } from '../TronStakeContext';
import { TronStakeFees } from '../TronStakeFees';
import { TronStakePendingTransaction } from '../TronStakePendingTransaction';
import { TronFreezeAmount } from './TronFreezeAmount';
import { TronFreezeResourceSelect } from './TronFreezeResourceSelect';
import { TronFreezeSubmitButton } from './TronFreezeSubmitButton';

export const TronFreezeStep = () => {
    const { form, actions } = useTronStakeContext();
    const { error } = actions;

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

                <TronStakeFees />

                {error && (
                    <Banner
                        intent="warning"
                        description={<Translation id="TR_EARN_TRON_SUBMIT_ERROR" />}
                    />
                )}

                <TronFreezeSubmitButton />

                <TronStakePendingTransaction
                    title={<Translation id="TR_EARN_TRON_PENDING_FREEZE" />}
                />
            </Column>
        </FormProvider>
    );
};
