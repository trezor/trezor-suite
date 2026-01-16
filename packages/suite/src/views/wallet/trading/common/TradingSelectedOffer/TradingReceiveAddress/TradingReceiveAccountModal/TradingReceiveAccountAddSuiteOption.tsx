import { Translation } from '@suite/intl';
import { cryptoIdToSymbol, parseCryptoId, useTradingUtils } from '@suite-common/trading';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { Column, Icon } from '@trezor/components';

import { openModal } from 'src/actions/suite/modalActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useReceiveAddressModalControls } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';

import { useTradingReceiveAddressValues } from '../useTradingReceiveAddressValues';
import { TradingReceiveAccountOptionRow } from './TradingReceiveAccountOptionRow';

export const TradingReceiveAccountAddSuiteOption = () => {
    const { cryptoId } = useTradingReceiveAddressValues();
    const modalControls = useReceiveAddressModalControls();

    const dispatch = useDispatch();
    const device = useSelector(selectSelectedDevice);
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
        <TradingReceiveAccountOptionRow
            data-testid="@trading/receive-account-modal/option/add-suite"
            onClick={onOptionClick}
        >
            <Icon name="plus" size={24} variant="tertiary" />
            <Column alignItems="flex-start">
                <Translation
                    id="TR_EXCHANGE_CREATE_SUITE_ACCOUNT"
                    values={{ symbol: networkName }}
                />
            </Column>
        </TradingReceiveAccountOptionRow>
    );
};
