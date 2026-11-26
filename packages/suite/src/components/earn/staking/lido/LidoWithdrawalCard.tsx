import { Translation } from '@suite/intl';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { type LidoWithdrawalRequest } from '@suite-common/wallet-core';
import { Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { UnstakingCard } from '../UnstakingCard';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const TEST_ID = '@staking/lido-withdrawal-card';

type LidoWithdrawalCardProps = {
    requests: readonly LidoWithdrawalRequest[];
    symbol: NetworkSymbol;
    withdrawalDays: number | null;
};

export const LidoWithdrawalCard = ({
    requests,
    symbol,
    withdrawalDays,
}: LidoWithdrawalCardProps) => {
    if (requests.length === 0) return null;

    const { decimals } = getNetwork(symbol);
    const total = requests.reduce(
        (amount, request) => amount.plus(request.amountOfStETH),
        new BigNumber(0),
    );

    return (
        <UnstakingCard
            isCompactAmount
            testId={TEST_ID}
            symbol={symbol}
            amount={total.shiftedBy(-decimals).toFixed()}
            rows={requests.map(({ id, amountOfStETH, requestedAt }) => ({
                testId: `${TEST_ID}/${id}`,
                amount: new BigNumber(amountOfStETH).shiftedBy(-decimals).toFixed(),
                availableAt:
                    withdrawalDays === null ? null : requestedAt + withdrawalDays * DAY_IN_MS,
                label: (
                    <Text typographyStyle="body-sm-strong">
                        <Translation id="TR_EARN_LIDO_WITHDRAWAL_NFT_ID" values={{ id }} />
                    </Text>
                ),
                unknownTimeId: 'TR_EARN_LIDO_STEP_IN_QUEUE',
            }))}
        />
    );
};
