import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type AccountDescriptor } from '@suite-common/wallet-types';
import { Text, type TextProps } from '@suite-native/atoms';
import { type StaticSessionId } from '@trezor/connect';

import { type CombinedLabelingState, selectAccountLabel } from '../selectors';

type AccountLabelStyleProps = {
    color?: TextProps['color'];
    variant?: TextProps['variant'];
};

type AccountLabelProps =
    | ({ account: Account } & AccountLabelStyleProps)
    | ({
          deviceStaticSessionId: StaticSessionId;
          accountDescriptor: AccountDescriptor;
          networkSymbol: NetworkSymbol;
      } & AccountLabelStyleProps);

const normalizeProps = (props: AccountLabelProps) =>
    'account' in props
        ? {
              deviceStaticSessionId: props.account.deviceState,
              networkSymbol: props.account.symbol,
              accountDescriptor: props.account.descriptor,
              color: props.color,
              variant: props.variant,
          }
        : props;

export const AccountLabel = (props: AccountLabelProps) => {
    const { accountDescriptor, deviceStaticSessionId, networkSymbol, color, variant } =
        normalizeProps(props);

    // This selector already handles the Suite Sync Feature & Legacy Label fallback
    const accountLabel = useSelector((state: CombinedLabelingState) =>
        selectAccountLabel(state, deviceStaticSessionId, accountDescriptor, networkSymbol),
    );

    return accountLabel ? (
        <Text color={color} variant={variant}>
            {accountLabel}
        </Text>
    ) : null;
};
