import { Account } from '@suite-common/wallet-types';
import { BadgeSize, Row, Text } from '@trezor/components';

import { useDefaultAccountLabel, useSelector } from 'src/hooks/suite';
import { selectLabelingDataForAccount } from 'src/reducers/suite/metadataReducer';

import { AccountTypeBadge } from './AccountTypeBadge';

interface AccountLabelProps {
    showAccountTypeBadge?: boolean;
    accountTypeBadgeSize?: BadgeSize;
    account: Account;
}

export const AccountLabel = ({
    showAccountTypeBadge,
    accountTypeBadgeSize = 'medium',
    account,
}: AccountLabelProps) => {
    const { getDefaultAccountLabel } = useDefaultAccountLabel();
    const suiteSyncAccountLabel = account.accountLabel;
    const { accountLabel: legacyAccountLabel } = useSelector(state =>
        selectLabelingDataForAccount(state, account.key),
    );
    const { symbol, accountType, index, path, networkType } = account;
    const accountLabel =
        suiteSyncAccountLabel ||
        legacyAccountLabel ||
        account.accountLabel ||
        getDefaultAccountLabel({ accountType, symbol, index });

    return (
        <Row gap={12} overflow="hidden" maxWidth="100%">
            <Text ellipsisLineCount={1}>{accountLabel}</Text>
            {showAccountTypeBadge && (
                <AccountTypeBadge
                    accountType={accountType}
                    size={accountTypeBadgeSize}
                    path={path}
                    networkType={networkType}
                />
            )}
        </Row>
    );
};
