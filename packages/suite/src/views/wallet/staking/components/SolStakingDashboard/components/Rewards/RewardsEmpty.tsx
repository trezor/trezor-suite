import { SOLANA_EPOCH_DAYS } from '@suite-common/wallet-constants';

import { Translation } from 'src/components/suite';
import { AccountExceptionLayout } from 'src/components/wallet';

export const RewardsEmpty = () => (
    <AccountExceptionLayout
        title={<Translation id="TR_STAKE_REWARDS_ARE_EMPTY" />}
        description={
            <Translation
                id="TR_STAKE_WAIT_TO_CHECK_REWARDS"
                values={{ count: SOLANA_EPOCH_DAYS }}
            />
        }
        iconName="arrowLineDown"
        iconVariant="tertiary"
    />
);
