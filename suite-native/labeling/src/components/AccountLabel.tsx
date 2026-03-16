import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type AccountDescriptor } from '@suite-common/wallet-types';
import { Text } from '@suite-native/atoms';
import { type StaticSessionId } from '@trezor/connect';

import { type CombinedLabelingState, selectAccountLabel } from '../selectors';

type AccountLabelProps = {
    deviceStaticSessionId: StaticSessionId;
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
};

type AccountLabelPropsWithAccount = AccountLabelProps | { account: Account };

const normalizeProps = (props: AccountLabelPropsWithAccount): AccountLabelProps =>
    'account' in props
        ? {
              deviceStaticSessionId: props.account.deviceState,
              networkSymbol: props.account.symbol,
              accountDescriptor: props.account.descriptor,
          }
        : props;

export const AccountLabel = (props: AccountLabelPropsWithAccount) => {
    const { accountDescriptor, deviceStaticSessionId, networkSymbol } = normalizeProps(props);

    // This selector already handles the Suite Sync Feature & Legacy Label fallback
    const accountLabel = useSelector((state: CombinedLabelingState) =>
        selectAccountLabel(state, deviceStaticSessionId, accountDescriptor, networkSymbol),
    );

    return accountLabel ? <Text>{accountLabel}</Text> : null;
};
