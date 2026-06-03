import { Translation } from '@suite/intl';
import { useTronStakingStats } from '@suite-common/earn-staking-api';
import { type EarnModalAction } from '@suite-common/suite-types/src/staking';
import { BulletList, Divider } from '@trezor/components';

import { formatApyValue } from 'src/components/earn/utils/earnApyUtils';

import { EarnInANutshellHighlights } from './components/EarnInANutshellHighlights';
import { EarnInANutshellModalLayout } from './components/EarnInANutshellModalLayout';
import {
    type EarnInANutshellProcess,
    EarnInANutshellProcesses,
} from './components/EarnInANutshellProcesses';
import { EarnInfoRow } from './components/EarnInfoRow';

const TRON_UNSTAKING_PERIOD_DAYS = 14;

interface TronStakeInANutshellModalProps {
    onCancel: () => void;
    actionType?: EarnModalAction;
}

export const TronStakeInANutshellModal = ({
    onCancel,
    actionType = 'close',
}: TronStakeInANutshellModalProps) => {
    const { data } = useTronStakingStats();
    const apy = data?.length ? Math.max(...data.map(({ apr }) => apr)) : null;

    const networkFeeBadge = { text: <Translation id="TR_TRADING_NETWORK_FEE" />, isBadge: true };

    const processes: EarnInANutshellProcess[] = [
        {
            heading: <Translation id="TR_EARN_STAKING_PROCESS" />,
            badge: <Translation id="TR_TX_FEE_COUNT" values={{ count: 2 }} />,
            content: (
                <BulletList bulletGap={12} gap={16} bulletSize="small" titleGap={4}>
                    <EarnInfoRow
                        heading={<Translation id="TR_EARN_TRON_FREEZE_TRANSACTION" />}
                        content={networkFeeBadge}
                    />
                    <EarnInfoRow
                        heading={<Translation id="TR_EARN_TRON_VOTE_TRANSACTION" />}
                        content={networkFeeBadge}
                    />
                    <EarnInfoRow
                        heading={<Translation id="TR_EARN_TRON_EARN_REWARDS" />}
                        content={{
                            text: (
                                <Translation
                                    id="TR_EARN_APY_APPROX"
                                    values={{ apyPercent: formatApyValue(apy) }}
                                />
                            ),
                        }}
                    />
                </BulletList>
            ),
        },
        {
            heading: <Translation id="TR_EARN_UNSTAKING_PROCESS" />,
            badge: <Translation id="TR_TX_FEE_COUNT" values={{ count: 2 }} />,
            content: (
                <BulletList bulletGap={12} gap={16} bulletSize="small" titleGap={4}>
                    <EarnInfoRow
                        heading={<Translation id="TR_EARN_SIGN_UNSTAKING_TRANSACTION" />}
                        content={networkFeeBadge}
                    />
                    <EarnInfoRow
                        heading={<Translation id="TR_EARN_COOL_DOWN_PERIOD" />}
                        content={{
                            text: (
                                <Translation
                                    id="TR_STAKE_DAYS"
                                    values={{ count: TRON_UNSTAKING_PERIOD_DAYS }}
                                />
                            ),
                        }}
                    />
                    <EarnInfoRow
                        heading={<Translation id="TR_EARN_SIGN_WITHDRAWAL_TRANSACTION" />}
                        content={networkFeeBadge}
                    />
                </BulletList>
            ),
        },
    ];

    return (
        <EarnInANutshellModalLayout
            heading={<Translation id="TR_EARN_TRON_STAKING_IN_A_NUTSHELL" />}
            onCancel={onCancel}
            actionType={actionType}
            onAction={onCancel}
        >
            <EarnInANutshellHighlights
                items={[
                    {
                        icon: 'lightning',
                        content: <Translation id="TR_EARN_TRON_NUTSHELL_RESOURCES" />,
                    },
                    {
                        icon: 'checkSquareOffset',
                        content: <Translation id="TR_EARN_TRON_NUTSHELL_FREEZE_VOTE" />,
                    },
                    {
                        icon: 'lockSimpleOpen',
                        content: <Translation id="TR_EARN_TRON_NUTSHELL_UNSTAKE" />,
                    },
                ]}
            />
            <Divider margin={{ top: 24, bottom: 16 }} />
            <EarnInANutshellProcesses items={processes} />
        </EarnInANutshellModalLayout>
    );
};
