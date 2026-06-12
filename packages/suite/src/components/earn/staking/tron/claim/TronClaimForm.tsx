import { FormProvider } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { Banner, Column, Text } from '@trezor/components';

import { useTronStakeContext } from '../TronStakeContext';
import { TronStakeFees } from '../TronStakeFees';
import { TronStakePendingTransaction } from '../TronStakePendingTransaction';
import { TronClaimAmount } from './TronClaimAmount';
import { TronClaimSubmitButton } from './TronClaimSubmitButton';

export const TronClaimForm = () => {
    const { form, actions } = useTronStakeContext();
    const { error } = actions;

    return (
        <FormProvider {...form.methods}>
            <Column gap={16}>
                <Text typographyStyle="headline-md">
                    <Translation id="TR_EARN_TRON_CLAIM_TITLE" />
                </Text>

                <TronClaimAmount />

                <TronStakeFees />

                {error && (
                    <Banner
                        intent="warning"
                        description={<Translation id="TR_EARN_TRON_SUBMIT_ERROR" />}
                    />
                )}

                <TronClaimSubmitButton />

                <TronStakePendingTransaction
                    title={<Translation id="TR_EARN_TRON_PENDING_CLAIM" />}
                />
            </Column>
        </FormProvider>
    );
};
