import { Translation } from '@suite/intl';
import { parseCryptoId, useTradingUtils } from '@suite-common/trading';
import { Column, Icon } from '@trezor/components';

import { useReceiveAddressModalControls } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';

import { useTradingReceiveAddressValues } from '../useTradingReceiveAddressValues';
import { TradingReceiveAccountOptionRow } from './TradingReceiveAccountOptionRow';

export const TradingReceiveAccountNonSuiteOption = () => {
    const { cryptoId } = useTradingReceiveAddressValues();
    const modalControls = useReceiveAddressModalControls();

    const { cryptoIdToPlatformName, cryptoIdToCoinName } = useTradingUtils();

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
