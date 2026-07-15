import { Translation } from '@suite/intl';
import { ArrowLineDownIcon } from '@trezor/icons';
import { SOLANA_EPOCH_DAYS } from '@trezor/network-solana/constants';

import { AccountExceptionLayout } from 'src/components/wallet';

export const RewardsEmpty = () => (
    <AccountExceptionLayout
        title={<Translation id="TR_EARN_REWARDS_ARE_EMPTY" />}
        description={
            <Translation
                id="TR_STAKE_WAIT_TO_CHECK_REWARDS"
                values={{ count: SOLANA_EPOCH_DAYS }}
            />
        }
        icon={ArrowLineDownIcon}
        iconVariant="neutral"
    />
);
