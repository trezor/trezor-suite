import { Translation } from '@suite/intl';
import { Account } from '@suite-common/wallet-types';
import { Banner, Column } from '@trezor/components';

import { EarnAvailableBalance } from './EarnAvailableBalance';

type YieldSupplyFormProps = {
    account: Account;
};

export const YieldSupplyForm = ({ account }: YieldSupplyFormProps) => (
    <Column gap={24} margin={{ bottom: 20 }}>
        <EarnAvailableBalance formattedBalance={account.formattedBalance} symbol={account.symbol} />
        <Banner intent="info" description={<Translation id="TR_EARN_NOT_AVAILABLE" />} />
    </Column>
);
