import { useSelector } from 'react-redux';

import { useTranslation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { selectNetworkConfigDeps } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';

import { getDefaultAccountLabel } from './getDefaultAccountLabel';
import { type SelectAccountLabelState, selectAccountLabel } from './selectAccountLabel';

type AccountLabelResult = {
    label: string;
    defaultLabel: string;
};

type UseAccountLabelParams = {
    account: Omit<Account, 'accountLabel'>;
};

export const useAccountLabel = ({ account }: UseAccountLabelParams): AccountLabelResult => {
    const { translationString } = useTranslation();
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    const accountLabel = useSelector((state: SelectAccountLabelState) =>
        selectAccountLabel(state, {
            accountDescriptor: account.descriptor,
            accountKey: account.key,
            deviceStaticId: account.deviceState,
            networkSymbol: account.symbol,
        }),
    );

    const defaultLabel = getDefaultAccountLabel(networkConfigDeps, translationString, account);

    return {
        label: accountLabel || defaultLabel,
        defaultLabel,
    };
};
