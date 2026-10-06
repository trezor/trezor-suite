import { setConnectionModal, setConnectionMode } from '@suite/device';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDevice } from '@suite-common/device';
import { injectDispatch } from '@suite-common/redux-utils';
import { cryptoIdToNetworkSymbol } from '@suite-common/trading';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Button } from '@trezor/components';
import { PlusIcon } from '@trezor/icons';

import { useSelector } from 'src/hooks/suite';
import { useReceiveAddressModalControls } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';

import { useTradingReceiveAddressValues } from '../useTradingReceiveAddressValues';

export const TradingReceiveAccountAddSuiteButton = () => {
    const { cryptoId } = useTradingReceiveAddressValues();
    const modalControls = useReceiveAddressModalControls();

    const { dispatch } = useServices(injectDispatch);
    const device = useSelector(selectSelectedDevice);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const symbol = cryptoIdToNetworkSymbol(cryptoId);

    const onClick = () => {
        if (!device?.connected) {
            if (device?.descriptor?.apiType === 'bluetooth') {
                dispatch(setConnectionMode('bluetooth'));
            }

            dispatch(setConnectionModal(true));

            return;
        }

        if (!symbol) return;

        modalControls.close();

        dispatch(
            openModal({
                type: 'add-account',
                device,
                symbol,
                isCoinjoinDisabled: true,
                isBackClickDisabled: true,
                onConfirm: () => {
                    modalControls.open('accountModal');
                },
            }),
        );
    };

    return (
        <Button
            data-testid="@trading/receive-account-modal/add-account"
            iconLeft={PlusIcon}
            intent="neutral"
            priority="secondary"
            isDisabled={isDiscoveryRunning}
            onClick={onClick}
        >
            <Translation id="TR_TRADING_RECEIVE_ADD_ACCOUNT" />
        </Button>
    );
};
