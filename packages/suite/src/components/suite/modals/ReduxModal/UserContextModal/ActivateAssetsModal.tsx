import { Translation } from '@suite/intl';
import { selectEnabledNetworks, startOrRestartDiscoveryThunk } from '@suite-common/wallet-core';
import { Modal } from '@trezor/components';

import { CoinGroup } from 'src/components/suite';
import { useNetworkSupport } from 'src/hooks/settings/useNetworkSupport';
import { useDispatch, useSelector } from 'src/hooks/suite';

type ActivateAssetsModalProps = {
    onCancel: () => void;
};

export const ActivateAssetsModal = ({ onCancel }: ActivateAssetsModalProps) => {
    const dispatch = useDispatch();
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const { supportedMainnets } = useNetworkSupport();

    const hasAnyEnabled = supportedMainnets.some(({ symbol }) => enabledNetworks.includes(symbol));

    const onAdd = () => {
        dispatch(startOrRestartDiscoveryThunk());
        onCancel();
    };

    return (
        <Modal
            onCancel={onCancel}
            heading={<Translation id="TR_COINS" />}
            description={<Translation id="TR_ACCOUNT_EXCEPTION_DISCOVERY_EMPTY_DESC" />}
            width={600}
            bottomContent={
                hasAnyEnabled ? (
                    <Modal.Button
                        onClick={onAdd}
                        isDisabled={!hasAnyEnabled}
                        data-testid="@modal/activate-assets/add"
                    >
                        <Translation id="TR_ADD" />
                    </Modal.Button>
                ) : null
            }
        >
            <CoinGroup networks={supportedMainnets} enabledNetworks={enabledNetworks} />
        </Modal>
    );
};
