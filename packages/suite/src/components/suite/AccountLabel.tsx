import { selectAccountLabel } from '@suite/account';
import { type Account } from '@suite-common/wallet-types';
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
    const accountLabel = useSelector(state =>
        selectAccountLabel(state, {
            accountDescriptor: account.descriptor,
            accountKey: account.key,
            deviceStaticId: account.deviceState,
            networkSymbol: account.symbol,
        }),
    );

    const { symbol, accountType, index, path, networkType } = account;
    const label = accountLabel || getDefaultAccountLabel({ accountType, symbol, index });

    return (
        <Row gap={12} overflow="hidden" maxWidth="100%" {...rowProps}>
            <Text
                intent={intent}
                priority={priority}
                isDisabled={isDisabled}
                typographyStyle={typographyStyle}
                ellipsisLineCount={1}
            >
                {label}
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
