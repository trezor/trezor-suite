import { useState } from 'react';
import { useWatch } from 'react-hook-form';
import { useSelector } from 'react-redux';

import { useTranslation } from '@suite/intl';
import {
    TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingAssetOption,
    type TradingExchangeType,
    canSwitchExchangeAssets,
    selectTradingExchangeBuyCryptoIds,
    selectTradingExchangeSellCryptoIds,
} from '@suite-common/trading';
import { selectEnabledNetworks } from '@suite-common/wallet-core';
import { IconButton, Row } from '@trezor/components';
import { ArrowsDownUpIcon } from '@trezor/icons';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';

import { TradingExchangeSwitchInactiveNetworkModal } from './TradingExchangeSwitchInactiveNetworkModal';
import { getPayAmountInFormUnit } from '../tradingFormInputsUtils';
import { type HandleAssetsSwitchParams } from '../useTradingExchangeAssetSelect';

type TradingExchangeAssetsSwitchButtonProps = {
    receiveAmount: string | undefined;
    onSwitch: (params: HandleAssetsSwitchParams) => void;
};

export const TradingExchangeAssetsSwitchButton = ({
    receiveAmount,
    onSwitch,
}: TradingExchangeAssetsSwitchButtonProps) => {
    const sellCryptoIds = useSelector(selectTradingExchangeSellCryptoIds);
    const buyCryptoIds = useSelector(selectTradingExchangeBuyCryptoIds);
    const enabledNetworks = useSelector(selectEnabledNetworks);

    const [inactiveNetworkAsset, setInactiveNetworkAsset] = useState<TradingAssetOption | null>(
        null,
    );

    const { translationString } = useTranslation();
    const { control, tradingReceiveAddress, shouldSendInSats } =
        useTradingFormContext<TradingExchangeType>();
    const [sendCryptoSelect, receiveCryptoSelect] = useWatch({
        control,
        name: [
            TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
            TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
        ],
    });

    const receiveAccountKey = tradingReceiveAddress.selectedAccount?.key;
    const isReceiveNetworkEnabled =
        !!receiveCryptoSelect && enabledNetworks.includes(receiveCryptoSelect.networkSymbol);
    const canSwitch =
        canSwitchExchangeAssets({
            sendCryptoId: sendCryptoSelect?.id,
            receiveCryptoId: receiveCryptoSelect?.id,
            sellCryptoIds,
            buyCryptoIds,
        }) &&
        (!isReceiveNetworkEnabled || !!receiveAccountKey);

    const handleClick = () => {
        if (!receiveCryptoSelect) {
            return;
        }

        if (!isReceiveNetworkEnabled) {
            setInactiveNetworkAsset(receiveCryptoSelect);
            onSwitch({});

            return;
        }

        onSwitch({
            receiveAccountKey,
            payAmount: receiveAmount
                ? getPayAmountInFormUnit(receiveAmount, shouldSendInSats)
                : undefined,
        });
    };

    return (
        <>
            <Row
                height={0}
                position={{ type: 'relative' }}
                zIndex={1}
                justifyContent="center"
                alignItems="center"
            >
                <IconButton
                    icon={ArrowsDownUpIcon}
                    intent="neutral"
                    priority="secondary"
                    size="small"
                    isFloating
                    isDisabled={!canSwitch}
                    onClick={handleClick}
                    data-testid="@trading/form/switch-assets"
                    aria-label={translationString('TR_TRADING_SWITCH_ASSETS')}
                    tooltip={{ isActive: false }}
                />
            </Row>

            {inactiveNetworkAsset && (
                <TradingExchangeSwitchInactiveNetworkModal
                    asset={inactiveNetworkAsset}
                    onClose={() => setInactiveNetworkAsset(null)}
                />
            )}
        </>
    );
};
