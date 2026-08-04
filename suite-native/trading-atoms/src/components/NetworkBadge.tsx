import { useServices } from '@suite-common/dependency-injection';
import { selectGetNetworkConfigDep } from '@suite-common/networks';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Badge } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

export type PlatformBadgeProps = {
    symbol: NetworkSymbol;
};

export const NetworkBadge = ({ symbol }: PlatformBadgeProps) => {
    const { getNetworkConfig } = useServices(selectGetNetworkConfigDep);
    const { translate } = useTranslate();

    const networkName = getNetworkConfig(symbol).name;

    return (
        <Badge
            label={networkName}
            accessibilityLabel={translate('tradingAtoms.networkName')}
            size="small"
        />
    );
};
