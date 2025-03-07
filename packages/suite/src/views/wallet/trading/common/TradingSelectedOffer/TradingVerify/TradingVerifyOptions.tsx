import { parseCryptoId, useTradingInfo } from '@suite-common/trading';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { Select } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    TradingVerifyFormAccountOptionProps,
    TradingVerifyOptionsProps,
} from 'src/types/trading/tradingVerify';
import { TradingVerifyOptionsItem } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingVerify/TradingVerifyOptionsItem';

export const TradingVerifyOptions = ({
    receiveNetwork,
    selectAccountOptions,
    selectedAccountOption,
    isMenuOpen,
    label,
    onChangeAccount,
}: TradingVerifyOptionsProps) => {
    const context = useTradingFormContext();
    const { cryptoIdToPlatformName, cryptoIdToCoinName } = useTradingInfo(context.type);

    const { networkId, contractAddress } = parseCryptoId(receiveNetwork);
    const coinSymbol = contractAddress
        ? cryptoIdToPlatformName(networkId)
        : cryptoIdToCoinName(networkId);
    const displaySymbol = coinSymbol && getDisplaySymbol(coinSymbol, contractAddress);

    return (
        <Select
            data-testid="@trading/verify-options/account"
            onChange={(selected: TradingVerifyFormAccountOptionProps) => onChangeAccount(selected)}
            value={selectedAccountOption}
            labelLeft={label}
            isClearable={false}
            options={selectAccountOptions}
            minValueWidth="70px"
            formatOptionLabel={option => (
                <TradingVerifyOptionsItem option={option} receiveNetwork={receiveNetwork} />
            )}
            isMenuOpen={isMenuOpen}
            isDisabled={selectAccountOptions.length === 1}
            placeholder={
                <Translation
                    id="TR_EXCHANGE_SELECT_RECEIVE_ACCOUNT"
                    values={{
                        symbol: displaySymbol,
                    }}
                />
            }
        />
    );
};
