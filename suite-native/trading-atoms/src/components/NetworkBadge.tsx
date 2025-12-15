import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { Badge } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

export type PlatformBadgeProps = {
    symbol: NetworkSymbol;
};

export const NetworkBadge = ({ symbol }: PlatformBadgeProps) => {
    const { translate } = useTranslate();

    const networkName = getNetwork(symbol).name;

    return (
        <Badge
            label={networkName}
            accessibilityLabel={translate('tradingAtoms.networkName')}
            size="small"
        />
    );
};
