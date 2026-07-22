import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type AccountDescriptor,
    type AccountKey,
    createAccountKey,
} from '@suite-common/wallet-types';
import { HStack, Text, type TextProps } from '@suite-native/atoms';
import { type CombinedLabelingState } from '@suite-native/labeling';
import { type StaticSessionId } from '@trezor/connect';

import { selectAccountLabel } from '../selectors';
import { AccountTypeBadge } from './AccountTypeBadge';

type AccountTypeBadgeOptions = {
    showAccountTypeBadge?: boolean;
};

type AccountLabelDescriptorProps = {
    deviceStaticSessionId: StaticSessionId;
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
} & TextProps &
    AccountTypeBadgeOptions;

type AccountLabelAccountProps = { account: Account } & TextProps & AccountTypeBadgeOptions;

export type AccountLabelPropsWithAccount = AccountLabelDescriptorProps | AccountLabelAccountProps;

type NormalizedAccountLabelProps = {
    accountKey: AccountKey;
    deviceStaticSessionId: StaticSessionId;
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
    showAccountTypeBadge: boolean;
    textProps: TextProps;
};

const normalizeProps = (props: AccountLabelPropsWithAccount): NormalizedAccountLabelProps => {
    if ('account' in props) {
        const { account, showAccountTypeBadge = false, ...textProps } = props;

        return {
            accountKey: account.key,
            deviceStaticSessionId: account.deviceState,
            networkSymbol: account.symbol,
            accountDescriptor: account.descriptor,
            showAccountTypeBadge,
            textProps,
        };
    }

    const {
        deviceStaticSessionId,
        accountDescriptor,
        networkSymbol,
        showAccountTypeBadge = false,
        ...textProps
    } = props;

    return {
        accountKey: createAccountKey({ accountDescriptor, networkSymbol, deviceStaticSessionId }),
        deviceStaticSessionId,
        accountDescriptor,
        networkSymbol,
        showAccountTypeBadge,
        textProps,
    };
};

export const AccountLabel = (props: AccountLabelPropsWithAccount) => {
    const {
        accountKey,
        accountDescriptor,
        deviceStaticSessionId,
        networkSymbol,
        showAccountTypeBadge,
        textProps,
    } = normalizeProps(props);

    // This selector already handles the Suite Sync Feature & Legacy Label fallback
    const accountLabel = useSelector((state: CombinedLabelingState) =>
        selectAccountLabel(state, deviceStaticSessionId, accountDescriptor, networkSymbol),
    );

    if (!accountLabel) {
        return null;
    }

    if (!showAccountTypeBadge) {
        return <Text {...textProps}>{accountLabel}</Text>;
    }

    return (
        <HStack alignItems="center" spacing="sp4">
            <Text {...textProps} style={{ flexShrink: 1, ...textProps.style }}>
                {accountLabel}
            </Text>
            <AccountTypeBadge accountKey={accountKey} />
        </HStack>
    );
};
