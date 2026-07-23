import { FormProvider } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { Banner, Column, Text } from '@trezor/components';

import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

import { useTronStakeContext } from '../TronStakeContext';
import { TronStakeFees } from '../TronStakeFees';
import { TronStakePendingTransaction } from '../TronStakePendingTransaction';
import { TronWithdrawAmount } from './TronWithdrawAmount';
import { TronWithdrawSubmitButton } from './TronWithdrawSubmitButton';

export const TronWithdrawForm = () => {
    const { form, actions, account } = useTronStakeContext();
    const { error } = actions;

    const { isWithdrawingDisabled, withdrawingMessageContent } = useMessageSystemStaking(
        account.symbol,
    );

    return (
        <FormProvider {...form.methods}>
            <Column gap={16}>
                <Text typographyStyle="headline-md">
                    <Translation id="TR_EARN_TRON_WITHDRAW_TITLE" />
                </Text>

                {isWithdrawingDisabled && (
                    <Banner intent="warning" description={withdrawingMessageContent} />
                )}

                <TronWithdrawAmount />

                <TronStakeFees />

                {error && (
                    <Banner
                        intent="warning"
                        description={<Translation id="TR_EARN_TRON_SUBMIT_ERROR" />}
                    />
                )}

                <TronWithdrawSubmitButton />

                <TronStakePendingTransaction
                    title={<Translation id="TR_EARN_TRON_PENDING_WITHDRAW" />}
                />
            </Column>
        </FormProvider>
    );
};
