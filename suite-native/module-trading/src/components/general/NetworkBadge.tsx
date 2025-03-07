import { CryptoId } from 'invity-api';

import { invariant } from '@suite-common/suite-utils';
import { cryptoIdToNetwork } from '@suite-common/trading';
import { Badge } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

export type PlatformBadgeProps = {
    cryptoId: CryptoId;
};

export const NetworkBadge = ({ cryptoId }: PlatformBadgeProps) => {
    const { translate } = useTranslate();

    const networkName = cryptoIdToNetwork(cryptoId)?.name;
    invariant(networkName, `Network name not found for cryptoId: ${cryptoId}`);

    return (
        <Badge
            label={networkName}
            accessibilityLabel={translate('moduleTrading.networkName')}
            size="small"
        />
    );
};
