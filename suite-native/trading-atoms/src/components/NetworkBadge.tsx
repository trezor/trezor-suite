import { selectNetworkConfigDeps } from '@suite-common/networks';
import { useServices } from '@suite-common/dependency-injection';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { Badge } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

export type PlatformBadgeProps = {
    symbol: NetworkSymbol;
};

export const NetworkBadge = ({ symbol }: PlatformBadgeProps) => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    const { translate } = useTranslate();

    const networkName = getNetwork(networkConfigDeps, symbol).name;

    return (
        <Badge
            label={networkName}
            accessibilityLabel={translate('tradingAtoms.networkName')}
            size="small"
        />
    );
};
