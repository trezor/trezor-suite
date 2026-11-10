import { Translation } from '@suite/intl';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Button } from '@trezor/components';

import { useSelector } from '../../../../../../../hooks/suite';
import { useReceiveAddressModalControls } from '../useReceiveAddressModalControls';

export const TradingReceiveAccountNonSuiteButton = () => {
    const modalControls = useReceiveAddressModalControls();

    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const onClick = () => {
        modalControls.open('customAddressModal');
    };

    return (
        <Button
            data-testid="@trading/receive-account-modal/use-external-account"
            intent="neutral"
            priority="secondary"
            isDisabled={isDiscoveryRunning}
            onClick={onClick}
        >
            <Translation id="TR_TRADING_RECEIVE_USE_EXTERNAL_ACCOUNT" />
        </Button>
    );
};
