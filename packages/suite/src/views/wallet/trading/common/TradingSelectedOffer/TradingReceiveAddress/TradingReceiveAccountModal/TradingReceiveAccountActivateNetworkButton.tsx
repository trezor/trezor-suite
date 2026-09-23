import { setConnectionModal, setConnectionMode } from '@suite/device';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDevice } from '@suite-common/device';
import { injectDispatch } from '@suite-common/redux-utils';
import { cryptoIdToNetworkSymbol, parseCryptoId, useTradingUtils } from '@suite-common/trading';
import { changeCoinVisibilityThunk, selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Button } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

import { useTradingReceiveAddressValues } from '../useTradingReceiveAddressValues';

export const TradingReceiveAccountActivateNetworkButton = () => {
    const { cryptoId } = useTradingReceiveAddressValues();

    const { dispatch } = useServices(injectDispatch);
    const device = useSelector(selectSelectedDevice);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const { cryptoIdToPlatformName, cryptoIdToCoinName } = useTradingUtils();

    const symbol = cryptoIdToNetworkSymbol(cryptoId);

    const { networkId, contractAddress } = parseCryptoId(cryptoId);
    const network = contractAddress
        ? cryptoIdToPlatformName(networkId)
        : cryptoIdToCoinName(networkId);

    const onClick = () => {
        if (!device?.connected) {
            if (device?.descriptor?.apiType === 'bluetooth') {
                dispatch(setConnectionMode('bluetooth'));
            }

            dispatch(setConnectionModal(true));

            return;
        }

        if (!symbol) return;

        dispatch(changeCoinVisibilityThunk({ symbol, shouldBeVisible: true }));
    };

    return (
        <Button
            data-testid="@trading/receive-account-modal/activate-network"
            isLoading={isDiscoveryRunning}
            onClick={onClick}
        >
            <Translation id="TR_ACCOUNT_SEARCH_ACTIVATE_NETWORK_CTA" values={{ network }} />
        </Button>
    );
};
