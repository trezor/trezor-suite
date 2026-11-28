import { useState } from 'react';

import { AssetSymbol } from '@suite/assets';
import { Translation } from '@suite/intl';
import { useRefreshStakingProductInfo } from '@suite-common/earn-staking';
import { type Account } from '@suite-common/wallet-types';
import { Column, SelectBar, Text } from '@trezor/components';

import { LidoUnstakeQueue } from './LidoUnstakeQueue';
import { LidoUnstakeSwap } from './LidoUnstakeSwap';
import { useLidoStaking } from './useLidoStaking';
import { useLidoTransaction } from './useLidoTransaction';

type LidoExit = 'queue' | 'swap';

type LidoUnstakeProps = {
    account: Account;
};

export const LidoUnstake = ({ account }: LidoUnstakeProps) => {
    const refreshProductInfo = useRefreshStakingProductInfo();
    const { withdrawalDays } = useLidoStaking(account);
    const displaySymbol = <AssetSymbol networkSymbol={account.symbol} />;

    const [exit, setExit] = useState<LidoExit>('queue');
    // The queue is unmounted while the swap is viewed, so what has to outlast that view is kept
    // here: the amount entered and the transactions that follow a withdrawal to its completion.
    const [queueAmount, setQueueAmount] = useState('');
    const approval = useLidoTransaction({ account, kind: 'approve' });
    const request = useLidoTransaction({ account, kind: 'request-withdrawal' });

    const isWithdrawalInProgress =
        approval.isSubmitting ||
        approval.pendingTxid !== null ||
        request.isSubmitting ||
        request.pendingTxid !== null;
    const selectedExit = isWithdrawalInProgress || request.isConfirmed ? 'queue' : exit;

    return (
        <>
            {!request.isConfirmed && (
                <>
                    <Column gap={8}>
                        <Text
                            typographyStyle="headline-md"
                            data-testid="@staking/lido-unstake/title"
                        >
                            <Translation id="TR_STAKE_UNSTAKE" />
                        </Text>
                        {selectedExit === 'queue' && (
                            <Text intent="neutral" priority="secondary">
                                {withdrawalDays === null ? (
                                    <Translation id="TR_EARN_LIDO_WITHDRAWAL_TIME_UNAVAILABLE" />
                                ) : (
                                    <Translation
                                        id="TR_EARN_LIDO_WITHDRAWAL_TIME"
                                        values={{ days: Math.ceil(withdrawalDays) }}
                                    />
                                )}
                            </Text>
                        )}
                    </Column>

                    <SelectBar
                        isFullWidth
                        isDisabled={isWithdrawalInProgress}
                        selectedOption={selectedExit}
                        onChange={setExit}
                        options={[
                            {
                                label: <Translation id="TR_EARN_LIDO_UNSTAKE_QUEUE_OPTION" />,
                                value: 'queue',
                                tooltip: (
                                    <Translation
                                        id="TR_EARN_LIDO_UNSTAKE_QUEUE_DESCRIPTION"
                                        values={{ displaySymbol }}
                                    />
                                ),
                            },
                            {
                                label: <Translation id="TR_EARN_LIDO_UNSTAKE_SWAP_OPTION" />,
                                value: 'swap',
                                tooltip: (
                                    <Translation
                                        id="TR_EARN_LIDO_UNSTAKE_SWAP_DESCRIPTION"
                                        values={{ displaySymbol }}
                                    />
                                ),
                            },
                        ]}
                        data-testid="@staking/lido-unstake/exit-select"
                    />
                </>
            )}

            {selectedExit === 'queue' ? (
                <LidoUnstakeQueue
                    account={account}
                    approval={approval}
                    request={request}
                    initialAmount={queueAmount}
                    onAmountChange={setQueueAmount}
                    onValueRetry={() => void refreshProductInfo({ force: true })}
                />
            ) : (
                <LidoUnstakeSwap account={account} />
            )}
        </>
    );
};
