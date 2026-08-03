import { FormProvider } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { Banner, Card, Column, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

import { useTronStakeContext } from '../TronStakeContext';
import { TronStakeFees } from '../TronStakeFees';
import { TronStakeInfoRow } from '../TronStakeInfoRow';
import { TronStakePendingTransaction } from '../TronStakePendingTransaction';
import { TronVoteApr } from './TronVoteApr';
import { TronVoteRepresentativeSelect } from './TronVoteRepresentativeSelect';
import { TronVoteSubmitButton } from './TronVoteSubmitButton';

export const TronVoteForm = () => {
    const { account, form, actions, fees } = useTronStakeContext();
    const { error, pendingTxid } = actions;

    const { isVotingDisabled, votingMessageContent } = useMessageSystemStaking(account.symbol);

    const hasInsufficientFunds = fees.composedLevels?.normal?.type === 'error';

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

                {isVotingDisabled && <Banner intent="warning" description={votingMessageContent} />}

                <Card type="contrast" paddingType="none">
                    <TronStakeInfoRow label={<Translation id="TR_TRON_VOTES" />}>
                        <Text typographyStyle="body-md-strong">{votes}</Text>
                    </TronStakeInfoRow>
                </Card>

                <TronVoteRepresentativeSelect />

                <TronVoteApr />

                <TronStakeFees />

                {hasInsufficientFunds && pendingTxid === null && (
                    <Banner
                        intent="warning"
                        description={
                            <Translation
                                id="AMOUNT_NOT_ENOUGH_CURRENCY_FEE"
                                values={{
                                    networkDisplaySymbol: getNetworkDisplaySymbol(account.symbol),
                                }}
                            />
                        }
                    />
                )}

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
