import { type Account } from '@suite-common/wallet-types';
import { type BadgeSize, type FlexProps, Row, Text, type TextProps } from '@trezor/components';
import { type TypographyStyle } from '@trezor/theme';

import { AccountTypeBadge } from '../AccountTypeBadge';
import { useAccountLabel } from './useAccountLabel';

type AccountLabelProps = {
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
    'data-testid'?: string;
};

export const AccountLabel = ({
    showAccountTypeBadge,
    accountTypeBadgeSize = 'medium',
    account,
    typographyStyle,
    intent,
    priority,
    isDisabled,
    rowProps,
    'data-testid': dataTestId,
}: AccountLabelProps) => {
    const { label } = useAccountLabel({ account });

    const { accountType, path, networkType } = account;

    return (
        <Row gap={12} overflow="hidden" maxWidth="100%" {...rowProps}>
            <Text
                data-testid={dataTestId}
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
