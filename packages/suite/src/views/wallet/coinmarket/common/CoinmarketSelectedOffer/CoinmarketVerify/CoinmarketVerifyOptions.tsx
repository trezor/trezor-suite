import { Select } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import {
    CoinmarketVerifyOptionsProps,
    CoinmarketVerifyFormAccountOptionProps,
} from 'src/types/coinmarket/coinmarketVerify';
import { parseCryptoId } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { CoinmarketVerifyOptionsItem } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketVerify/CoinmarketVerifyOptionsItem';

export const CoinmarketVerifyOptions = ({
    receiveNetwork,
    selectAccountOptions,
    selectedAccountOption,
    isMenuOpen,
    onChangeAccount,
}: CoinmarketVerifyOptionsProps) => {
    const { cryptoIdToPlatformName, cryptoIdToCoinName } = useCoinmarketInfo();

    const { networkId, contractAddress } = parseCryptoId(receiveNetwork);
    const networkName = contractAddress
        ? cryptoIdToPlatformName(networkId)
        : cryptoIdToCoinName(networkId);

    return (
        <Select
            onChange={(selected: CoinmarketVerifyFormAccountOptionProps) =>
                onChangeAccount(selected)
            }
            value={selectedAccountOption}
            isClearable={false}
            options={selectAccountOptions}
            minValueWidth="70px"
            formatOptionLabel={option => (
                <CoinmarketVerifyOptionsItem option={option} receiveNetwork={receiveNetwork} />
            )}
            isMenuOpen={isMenuOpen}
            isDisabled={selectAccountOptions.length === 1}
            placeholder={
                <Translation
                    id="TR_EXCHANGE_SELECT_RECEIVE_ACCOUNT"
                    values={{
                        symbol: networkName,
                    }}
                />
            }
        />
    );
};
