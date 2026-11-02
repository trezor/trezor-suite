import { Translation } from '@suite/intl';
import { type Account } from '@suite-common/wallet-types';
import { CardList, Row, Text } from '@trezor/components';
import { NetworkIcon } from '@trezor/product-components';

import { AccountLabeling } from 'src/components/suite/labeling/AccountLabeling';

type AllowanceAccountRowProps = {
    account: Account;
};

export const AllowanceAccountRow = ({ account }: AllowanceAccountRowProps) => (
    <CardList.Item>
        <Text typographyStyle="body-sm">
            <Translation id="TR_ACCOUNT" />
        </Text>
        <Row gap={8} data-testid="@modal/approve/account-value">
            <NetworkIcon networkSymbol={account.symbol} size={20} />
            <AccountLabeling
                account={account}
                showAccountTypeBadge
                accountTypeBadgeSize="small"
                typographyStyle="body-sm"
            />
        </Row>
    </CardList.Item>
);
