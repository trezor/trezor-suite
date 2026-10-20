import { useEvent } from 'react-use';

import { Translation } from '@suite/intl';
import { type TradingAssetOption } from '@suite-common/trading';
import { Column, H3, Modal, Text } from '@trezor/components';
import { TokenIcon } from '@trezor/product-components';

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
                    {asset.isNativeToken ? (
                        <TokenIcon size={48} symbol={asset.symbol} showNetworkIcon />
                    ) : (
                        <TokenIcon
                            size={48}
                            symbol={asset.networkSymbol}
                            contractAddress={asset.contractAddress}
                            placeholder={asset.displaySymbol}
                            showNetworkIcon
                        />
                    )}
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
