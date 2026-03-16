import { Translation } from '@suite/intl';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type NetworkSymbol, getNetwork, getNetworkFeatures } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { union } from '@trezor/utils';

import { isNetworkWithGraphFeature } from 'src/utils/wallet/graph';

const hasAnyAccountWithTokens = (accounts: Account[]): boolean =>
    accounts.some(account => getNetworkFeatures(account.symbol).includes('tokens'));

export const useUnsupportedNetworkMessage = ({
    showGraphControls,
    device,
    accounts,
    isGraphHidden,
}: {
    showGraphControls: boolean;
    device?: TrezorDevice;
    accounts: Account[];
    isGraphHidden: boolean;
}) => {
    const affectedAccounts =
        showGraphControls && !hasBitcoinOnlyFirmware(device)
            ? accounts
                  .filter(
                      account =>
                          account.history &&
                          !isNetworkWithGraphFeature(account.symbol, account.backendType),
                  )
                  .map(({ symbol }) => symbol)
            : [];

    const affectedNetworks = union(affectedAccounts);
    const hasTokens = hasAnyAccountWithTokens(accounts);
    const showMissingDataTooltip =
        !isGraphHidden && (affectedNetworks.length > 0 || hasAnyAccountWithTokens(accounts));

    return { affectedNetworks, showMissingDataTooltip, hasTokens };
};

type MessageProps = {
    affectedNetworks: NetworkSymbol[];
    hasTokens: boolean;
};

const Message = ({ affectedNetworks, hasTokens }: MessageProps) => {
    const hasNetworks = affectedNetworks.length > 0;
    const networksString = affectedNetworks.map(network => getNetwork(network).name).join(', ');

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
    affectedNetworks: NetworkSymbol[];
    hasTokens: boolean;
};

export const UnsupportedAssetsMessage = ({
    affectedNetworks,
    hasTokens,
}: UnsupportedAssetsMessageProps) => (
    <Message affectedNetworks={affectedNetworks} hasTokens={hasTokens} />
);
