import { selectSuiteSyncAccountLabel } from '@suite-common/suite-sync';
import { Account } from '@suite-common/wallet-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { BadgeSize, FlexProps, Row, Text, TextProps } from '@trezor/components';

import { useDefaultAccountLabel, useSelector } from 'src/hooks/suite';
import { selectLabelingDataForAccount } from 'src/reducers/suite/metadataReducer';

import { AccountTypeBadge } from './AccountTypeBadge';

interface AccountLabelProps {
    showAccountTypeBadge?: boolean;
    accountTypeBadgeSize?: BadgeSize;
    // Defensive programming to prevent passing 'accountLabel' by mistake.
    // Labeling shall be solved (selected for) only here!
    account: Omit<Account, 'accountLabel'>;
    variant?: TextProps['variant'];
    typographyStyle?: TextProps['typographyStyle'];
    rowProps?: Omit<FlexProps, 'children'>;
}

export const AccountLabel = ({
    showAccountTypeBadge,
    accountTypeBadgeSize = 'medium',
    account,
    typographyStyle,
    variant,
    rowProps,
}: AccountLabelProps) => {
    const { getDefaultAccountLabel } = useDefaultAccountLabel();
    const { walletDescriptor } = parseDeviceStaticSessionId(account.deviceState);

    const suiteSyncAccountLabel = useSelector(state =>
        selectSuiteSyncAccountLabel(state, walletDescriptor, account.descriptor, account.symbol),
    );

    const accountMetadata = useSelector(state => selectLabelingDataForAccount(state, account.key));

    const { symbol, accountType, index, path, networkType } = account;
    const accountLabel =
        suiteSyncAccountLabel || // Suite Sync
        accountMetadata.accountLabel || // Legacy Labeling
        getDefaultAccountLabel({ accountType, symbol, index });

    return (
        <Row gap={12} overflow="hidden" maxWidth="100%" {...rowProps}>
            <Text variant={variant} typographyStyle={typographyStyle} ellipsisLineCount={1}>
                {accountLabel}
            </Text>
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
