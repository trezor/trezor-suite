import { FormProvider } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { Banner, Card, Column, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { useTronStakeContext } from '../TronStakeContext';
import { TronStakeFees } from '../TronStakeFees';
import { TronStakeInfoRow } from '../TronStakeInfoRow';
import { TronStakePendingTransaction } from '../TronStakePendingTransaction';
import { TronVoteApr } from './TronVoteApr';
import { TronVoteRepresentativeSelect } from './TronVoteRepresentativeSelect';
import { TronVoteSubmitButton } from './TronVoteSubmitButton';

export const TronVoteForm = () => {
    const { account, form, actions } = useTronStakeContext();
    const { error } = actions;

    const totalVotingPower =
        account.networkType === 'tron'
            ? account.misc.tronResources?.stakingInfo?.totalVotingPower
            : undefined;
    const votes = Math.floor(new BigNumber(totalVotingPower ?? 0).toNumber());

    return (
        <FormProvider {...form.methods}>
            <Column gap={16}>
                <Text typographyStyle="headline-md">
                    <Translation id="TR_EARN_TRON_CHANGE_REPRESENTATIVE" />
                </Text>

                <Card fillType="flat" paddingType="none">
                    <TronStakeInfoRow label={<Translation id="TR_TRON_VOTES" />}>
                        <Text typographyStyle="body-md-strong">{votes}</Text>
                    </TronStakeInfoRow>
                </Card>

                <TronVoteRepresentativeSelect />

                <TronVoteApr />

                <TronStakeFees />

                {error && (
                    <Banner
                        intent="warning"
                        description={<Translation id="TR_EARN_TRON_SUBMIT_ERROR" />}
                    />
                )}

                <TronVoteSubmitButton />

                <TronStakePendingTransaction
                    title={<Translation id="TR_EARN_TRON_PENDING_VOTE" />}
                />
            </Column>
        </FormProvider>
    );
};
