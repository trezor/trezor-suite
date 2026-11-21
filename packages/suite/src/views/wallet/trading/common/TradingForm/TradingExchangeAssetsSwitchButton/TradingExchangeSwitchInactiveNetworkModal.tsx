import { useEvent } from 'react-use';

import { AssetIcon } from '@suite/assets';
import { Translation } from '@suite/intl';
import { type TradingAssetOption } from '@suite-common/trading';
import { Column, H3, Modal, Text } from '@trezor/components';

type TradingExchangeSwitchInactiveNetworkModalProps = {
    asset: TradingAssetOption;
    onClose: () => void;
};

export const TradingExchangeSwitchInactiveNetworkModal = ({
    asset,
    onClose,
}: TradingExchangeSwitchInactiveNetworkModalProps) => {
    useEvent('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onClose();
        }
    });

    return (
        <Modal.Backdrop onClick={onClose}>
            <Modal.ModalBase
                data-testid="@trading/form/switch-assets-modal"
                width={400}
                bottomContent={
                    <Modal.Button
                        onClick={onClose}
                        data-testid="@trading/form/switch-assets-modal/confirm"
                    >
                        <Translation id="TR_GOT_IT" />
                    </Modal.Button>
                }
            >
                <Column gap={16} alignItems="flex-start">
                    <AssetIcon
                        size={48}
                        networkSymbol={asset.networkSymbol}
                        contractAddress={asset.isNativeToken ? undefined : asset.contractAddress}
                        showNetworkIcon
                    />
                    <Column gap={4} alignItems="flex-start">
                        <H3>
                            <Translation id="TR_TRADING_SWITCH_ASSETS_INACTIVE_NETWORK_TITLE" />
                        </H3>
                        <Text intent="neutral" priority="secondary" typographyStyle="body-md">
                            <Translation
                                id="TR_TRADING_SWITCH_ASSETS_INACTIVE_NETWORK_DESCRIPTION"
                                values={{ network: asset.networkName }}
                            />
                        </Text>
                    </Column>
                </Column>
            </Modal.ModalBase>
        </Modal.Backdrop>
    );
};
