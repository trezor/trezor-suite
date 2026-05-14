import { Translation } from '@suite/intl';
import { parseCryptoId, useTradingUtils } from '@suite-common/trading';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { IconCircle, Row } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { TradingReceiveOptionRow } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/TradingReceiveOptionRow';
import { useReceiveAddressModalControls } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';

import { useTradingReceiveAddressValues } from '../useTradingReceiveAddressValues';

export const TradingReceiveAccountNonSuiteOption = () => {
    const { cryptoId } = useTradingReceiveAddressValues();
    const modalControls = useReceiveAddressModalControls();
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const { cryptoIdToPlatformName, cryptoIdToCoinName } = useTradingUtils();

    const { networkId, contractAddress } = parseCryptoId(cryptoId);
    const networkName = contractAddress
        ? cryptoIdToPlatformName(networkId)
        : cryptoIdToCoinName(networkId);

    const onOptionClick = () => {
        modalControls.open('customAddressModal');
    };

    return (
        <TradingReceiveOptionRow
            data-testid="@trading/receive-account-modal/option/non-suite"
            isDisabled={isDiscoveryRunning}
            onClick={onOptionClick}
        >
            <Row gap={12}>
                <IconCircle name="arrowSquareOut" size={24} intent="neutral" />
                <Translation
                    id="TR_EXCHANGE_USE_NON_SUITE_ACCOUNT"
                    values={{ symbol: networkName }}
                />
            </Row>
        </TradingReceiveOptionRow>
    );
};
