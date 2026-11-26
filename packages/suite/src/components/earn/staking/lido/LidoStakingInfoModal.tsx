import { Translation } from '@suite/intl';
import { type Account } from '@suite-common/wallet-types';
import { LightningIcon, LockSimpleOpenIcon, TrendUpIcon } from '@trezor/icons';

import { useFormatApy } from '#src/hooks/earn/useFormatApy';

import { useLidoStaking } from './useLidoStaking';
import { EarnInANutshellHighlights } from '../../modals/EarnInANutshell/components/EarnInANutshellHighlights';
import { EarnInANutshellModalLayout } from '../../modals/EarnInANutshell/components/EarnInANutshellModalLayout';

type LidoStakingInfoModalProps = {
    account: Account;
    onClose: () => void;
    onContinue?: () => void;
};

export const LidoStakingInfoModal = ({
    account,
    onClose,
    onContinue,
}: LidoStakingInfoModalProps) => {
    const { rate, withdrawalDays } = useLidoStaking(account);
    const formatApy = useFormatApy();

    return (
        <EarnInANutshellModalLayout
            heading={<Translation id="TR_EARN_LIDO_STAKING_IN_A_NUTSHELL" />}
            onCancel={onClose}
            actionType={onContinue ? 'continue' : 'close'}
            hasCancelButton={!!onContinue}
            onAction={onContinue ?? onClose}
        >
            <EarnInANutshellHighlights
                items={[
                    {
                        icon: LightningIcon,
                        content: <Translation id="TR_EARN_LIDO_NUTSHELL_STAKE" />,
                    },
                    {
                        icon: TrendUpIcon,
                        content: (
                            <>
                                <Translation id="TR_EARN_LIDO_NUTSHELL_REWARDS" />{' '}
                                {rate !== null && (
                                    <Translation
                                        id="TR_EARN_APR_APPROX"
                                        values={{ aprPercent: formatApy(rate) }}
                                    />
                                )}
                            </>
                        ),
                    },
                    {
                        icon: LockSimpleOpenIcon,
                        content: (
                            <>
                                <Translation id="TR_EARN_LIDO_NUTSHELL_EXIT" />{' '}
                                {withdrawalDays !== null && (
                                    <Translation
                                        id="TR_EARN_LIDO_WITHDRAWAL_TIME"
                                        values={{ days: Math.ceil(withdrawalDays) }}
                                    />
                                )}
                            </>
                        ),
                    },
                ]}
            />
        </EarnInANutshellModalLayout>
    );
};
