import { TrezorDevice } from '@suite-common/suite-types';
import { getNetworkFeatures } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { capitalizeFirstLetter, union } from '@trezor/utils';

import { isNetworkWithGraphFeature } from 'src/utils/wallet/graph';

import { Translation } from '../../../components/suite/Translation';

const hasAnyAccountWithTokens = (accounts: Account[]): boolean =>
    accounts.some(account => getNetworkFeatures(account.symbol).includes('tokens'));

export const useUnsupportedNetworkMessage = ({
    showGraphControls,
    device,
    accounts,
}: {
    showGraphControls: boolean;
    device?: TrezorDevice;
    accounts: Account[];
}) => {
    const affectedAccounts =
        showGraphControls && !hasBitcoinOnlyFirmware(device)
            ? accounts
                  .filter(account => account.history && !isNetworkWithGraphFeature(account.symbol))
                  .map(({ networkType }) => networkType)
            : [];

    const affectedNetworks = union(affectedAccounts);
    const hasTokens = hasAnyAccountWithTokens(accounts);
    const showMissingDataTooltip = affectedNetworks.length > 0 || hasAnyAccountWithTokens(accounts);

    return { affectedNetworks, showMissingDataTooltip, hasTokens };
};

type MessageProps = {
    affectedNetworks: string[];
    hasTokens: boolean;
};

const Message = ({ affectedNetworks, hasTokens }: MessageProps) => {
    const hasNetworks = affectedNetworks.length > 0;
    const networksString = affectedNetworks
        .map(network => capitalizeFirstLetter(network))
        .join(', ');

    if (hasNetworks && hasTokens) {
        return (
            <Translation
                id="TR_GRAPH_MISSING_DATA_WITH_TOKENS"
                values={{ networks: networksString }}
            />
        );
    } else if (hasNetworks) {
        return (
            <Translation
                id="TR_GRAPH_MISSING_DATA_NETWORKS"
                values={{ networks: networksString }}
            />
        );
    } else {
        return <Translation id="TR_GRAPH_MISSING_DATA_TOKENS" />;
    }
};

type UnsupportedAssetsMessageProps = {
    affectedNetworks: string[];
    hasTokens: boolean;
};

export const UnsupportedAssetsMessage = ({
    affectedNetworks,
    hasTokens,
}: UnsupportedAssetsMessageProps) => (
    <Message affectedNetworks={affectedNetworks} hasTokens={hasTokens} />
);
