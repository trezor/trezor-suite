import { useSelector } from 'react-redux';

import { WithLabelingState, selectAccountLabel } from '@suite-common/local-first-storage';
import { AccountKey, WalletDescriptor } from '@suite-common/wallet-types';
import { Text } from '@suite-native/atoms';

import { useIsLabelingEnabled } from './useIsLabelingEnabled';

type AccountLabelEProps = {
    walletDescriptor: WalletDescriptor;
    accountKey: AccountKey;
    /** @deprecated this shall be removed once Evolu labeling is rolled out and account.accountLabel data migrated */
    fallbackLabel: string | undefined;
};

export const AccountLabel = ({
    accountKey,
    walletDescriptor,
    fallbackLabel,
}: AccountLabelEProps) => {
    const isLabelingEnabled = useIsLabelingEnabled();

    const label = useSelector((state: WithLabelingState) =>
        selectAccountLabel({ state, walletDescriptor, accountKey }),
    )?.label;

    if (!isLabelingEnabled) {
        return fallbackLabel;
    }

    return <Text>{label}</Text>;
};
