import { Translation } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import { cryptoIdToSymbol, parseCryptoId, useTradingUtils } from '@suite-common/trading';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { IconCircle, Row } from '@trezor/components';

import { openModal } from 'src/actions/suite/modalActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { TradingReceiveOptionRow } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/TradingReceiveOptionRow';
import { useReceiveAddressModalControls } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';

import { useTradingReceiveAddressValues } from '../useTradingReceiveAddressValues';

export const TradingReceiveAccountAddSuiteOption = () => {
    const { cryptoId } = useTradingReceiveAddressValues();
    const modalControls = useReceiveAddressModalControls();

    const dispatch = useDispatch();
    const device = useSelector(selectSelectedDevice);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const { cryptoIdToPlatformName, cryptoIdToCoinName } = useTradingUtils();

    const symbol = cryptoIdToSymbol(cryptoId);

    const { networkId, contractAddress } = parseCryptoId(cryptoId);
    const networkName = contractAddress
        ? cryptoIdToPlatformName(networkId)
        : cryptoIdToCoinName(networkId);

    const onOptionClick = () => {
        if (!device || !symbol) return;

        modalControls.close();

        dispatch(
            openModal({
                type: 'add-account',
                device,
                symbol,
                noRedirect: true,
                isCoinjoinDisabled: true,
                isBackClickDisabled: true,
                onConfirm: () => {
                    modalControls.open('accountModal');
                },
            }),
        );
    };

    return (
        <TradingReceiveOptionRow
            data-testid="@trading/receive-account-modal/option/add-suite"
            isDisabled={isDiscoveryRunning}
            onClick={onOptionClick}
        >
            <Row gap={12}>
                <IconCircle name="plus" size={24} intent="neutral" />
                <Translation
                    id="TR_EXCHANGE_CREATE_SUITE_ACCOUNT"
                    values={{ symbol: networkName }}
                />
            </Row>
        </TradingReceiveOptionRow>
    );
};
