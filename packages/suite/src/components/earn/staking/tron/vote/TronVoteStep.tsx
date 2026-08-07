import { FormProvider } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { getNetworkDisplaySymbol , selectNetworkConfigDeps } from '@suite-common/wallet-config';
import { Banner, Column } from '@trezor/components';

import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

import { useTronStakeContext } from '../TronStakeContext';
import { TronStakeFees } from '../TronStakeFees';
import { TronStakePendingTransaction } from '../TronStakePendingTransaction';
import { TronVoteApr } from './TronVoteApr';
import { TronVoteRepresentativeSelect } from './TronVoteRepresentativeSelect';
import { TronVoteSubmitButton } from './TronVoteSubmitButton';

export const TronVoteStep = () => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);
    const { form, actions, account, fees } = useTronStakeContext();
    const { error, pendingTxid } = actions;

    const { isVotingDisabled, votingMessageContent } = useMessageSystemStaking(account.symbol);

    const hasInsufficientFunds = fees.composedLevels?.normal?.type === 'error';

    return (
        <FormProvider {...form.methods}>
            <Column gap={16}>
                {isVotingDisabled && <Banner intent="warning" description={votingMessageContent} />}

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
                                    networkDisplaySymbol: getNetworkDisplaySymbol(
                                        networkConfigDeps,
                                        account.symbol,
                                    ),
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
