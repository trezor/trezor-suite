import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type AccountDescriptor } from '@suite-common/wallet-types';
import { Text, type TextProps } from '@suite-native/atoms';
import { type StaticSessionId } from '@trezor/connect';

import { type CombinedLabelingState, selectAccountLabel } from '../selectors';

type AccountLabelProps = {
    deviceStaticSessionId: StaticSessionId;
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
} & TextProps;

export type AccountLabelPropsWithAccount = AccountLabelProps | ({ account: Account } & TextProps);

const normalizeProps = (props: AccountLabelPropsWithAccount): AccountLabelProps => {
    if ('account' in props) {
        const { account, ...textProps } = props;

        return {
            deviceStaticSessionId: account.deviceState,
            networkSymbol: account.symbol,
            accountDescriptor: account.descriptor,
            ...textProps,
        };
    }

    return props;
};

export const AccountLabel = (props: AccountLabelPropsWithAccount) => {
    const { accountDescriptor, deviceStaticSessionId, networkSymbol, ...textProps } =
        normalizeProps(props);

    // This selector already handles the Suite Sync Feature & Legacy Label fallback
    const accountLabel = useSelector((state: CombinedLabelingState) =>
        selectAccountLabel(state, deviceStaticSessionId, accountDescriptor, networkSymbol),
    );

    return accountLabel ? <Text {...textProps}>{accountLabel}</Text> : null;
};
