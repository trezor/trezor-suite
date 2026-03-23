import { selectLabelingDataForAccount } from '@suite/metadata';
import { selectSuiteSyncAccountLabel } from '@suite-common/suite-sync';
import { type Account } from '@suite-common/wallet-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { type BadgeSize, type FlexProps, Row, Text, type TextProps } from '@trezor/components';
import { type TypographyStyle } from '@trezor/theme';

import { useDefaultAccountLabel, useSelector } from 'src/hooks/suite';

import { AccountTypeBadge } from './AccountTypeBadge';

interface AccountLabelProps {
    showAccountTypeBadge?: boolean;
    accountTypeBadgeSize?: BadgeSize;
    // Defensive programming to prevent passing 'accountLabel' by mistake.
    // Labeling shall be solved (selected for) only here!
    account: Omit<Account, 'accountLabel'>;
    intent?: TextProps['intent'];
    priority?: TextProps['priority'];
    isDisabled?: TextProps['isDisabled'];
    typographyStyle?: TypographyStyle;
    rowProps?: Omit<FlexProps, 'children'>;
}

export const AccountLabel = ({
    showAccountTypeBadge,
    accountTypeBadgeSize = 'medium',
    account,
    typographyStyle,
    intent,
    priority,
    isDisabled,
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
            <Text
                intent={intent}
                priority={priority}
                isDisabled={isDisabled}
                typographyStyle={typographyStyle}
                ellipsisLineCount={1}
            >
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
