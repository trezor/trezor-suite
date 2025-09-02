import { TrezorDevice } from '@suite-common/suite-types';
import { getNetworkFeatures } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { Text } from '@trezor/components';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';

import { Translation } from '../../../components/suite';

const UNSUPPORTED_NETWORKS = ['ripple', 'solana', 'stellar'];

export const useUnsupportedNetworkMessage = ({
    showGraphControls,
    device,
    accounts,
}: {
    showGraphControls: boolean;
    device?: TrezorDevice;
    accounts: Account[];
}) => {
    const hasAnyAccountWithTokens = (accounts: Account[]): boolean =>
        accounts.some(account => {
            const features = getNetworkFeatures(account.symbol);

            return features?.includes('tokens') ?? false;
        });

    const affectedAccounts =
        showGraphControls &&
        !hasBitcoinOnlyFirmware(device) &&
        accounts
            .filter(
                account => account.history && UNSUPPORTED_NETWORKS.includes(account.networkType),
            )
            .map(({ networkType }) => networkType);

    const affectedNetworks = [...new Set(affectedAccounts || [])];
    const hasTokens = hasAnyAccountWithTokens(accounts);
    const showMissingDataTooltip = affectedNetworks.length > 0 || hasTokens;

    return { affectedNetworks, showMissingDataTooltip, hasTokens };
};

type MessageProps = {
    affectedNetworks: string[];
    hasTokens: boolean;
};

const capitalizeFirstLetter = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

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
    <Text variant="tertiary" typographyStyle="hint">
        <Message affectedNetworks={affectedNetworks} hasTokens={hasTokens} />
    </Text>
);
