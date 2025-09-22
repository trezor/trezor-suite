import { parseCryptoId, useTradingInfo } from '@suite-common/trading';
import { Column, Icon } from '@trezor/components';

import { Translation } from 'src/components/suite/Translation';
import { useReceiveAddressModalControls } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';

import { TradingReceiveAccountOptionRow } from './TradingReceiveAccountOptionRow';
import { useTradingReceiveAddressValues } from '../useTradingReceiveAddressValues';

export const TradingReceiveAccountNonSuiteOption = () => {
    const { cryptoId } = useTradingReceiveAddressValues();
    const modalControls = useReceiveAddressModalControls();

    const { cryptoIdToPlatformName, cryptoIdToCoinName } = useTradingInfo();

    const { networkId, contractAddress } = parseCryptoId(cryptoId);
    const networkName = contractAddress
        ? cryptoIdToPlatformName(networkId)
        : cryptoIdToCoinName(networkId);

    const onOptionClick = () => {
        modalControls.open('customAddressModal');
    };

    return (
        <TradingReceiveAccountOptionRow
            data-testid="@trading/receive-account-modal/option/non-suite"
            onClick={onOptionClick}
        >
            <Icon name="arrowSquareOut" size={24} variant="tertiary" />
            <Column alignItems="flex-start">
                <Translation
                    id="TR_EXCHANGE_USE_NON_SUITE_ACCOUNT"
                    values={{ symbol: networkName }}
                />
            </Column>
        </TradingReceiveAccountOptionRow>
    );
};
