import {
    cryptoToNetworkSymbol,
    isCryptoSymbolToken,
} from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { Control, Controller } from 'react-hook-form';
import { Select, useElevation } from '@trezor/components';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import {
    CoinmarketAccountOptionsGroupOptionProps,
    CoinmarketTradeSellExchangeType,
} from 'src/types/coinmarket/coinmarket';
import { networks } from '@suite-common/wallet-config';
import {
    CoinmarketFormOption,
    CoinmarketFormOptionGroupLabel,
    CoinmarketFormOptionLabel,
    CoinmarketFormOptionLabelLong,
    CoinmarketFormOptionNetwork,
} from 'src/views/wallet/coinmarket';
import CoinmarketFormInputLabel from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputLabel';
import {
    CoinmarketFormInputDefaultProps,
    CoinmarketSellExchangeFormProps,
} from 'src/types/coinmarket/coinmarketForm';
import { FORM_CRYPTO_CURRENCY_SELECT } from 'src/constants/wallet/coinmarket/form';
import { useCoinmarketBuildAccountGroups } from 'src/hooks/wallet/coinmarket/form/useCoinmarketSellFormDefaultValues';
import { CoinmarketFormOptionIcon } from 'src/views/wallet/coinmarket/common/CoinmarketCoinImage';

const CoinmarketFormInputAccountActive = ({ label }: CoinmarketFormInputDefaultProps) => {
    const {
        form: {
            helpers: { onCryptoCurrencyChange },
        },
    } = useCoinmarketFormContext<CoinmarketTradeSellExchangeType>();
    const { elevation } = useElevation();
    const { control } = useCoinmarketFormContext();
    const optionGroups = useCoinmarketBuildAccountGroups();

    return (
        <>
            <CoinmarketFormInputLabel label={label} />
            <Controller
                name={FORM_CRYPTO_CURRENCY_SELECT}
                control={control as Control<CoinmarketSellExchangeFormProps>}
                render={({ field: { onChange, value } }) => (
                    <Select
                        value={value}
                        options={optionGroups}
                        onChange={(selected: CoinmarketAccountOptionsGroupOptionProps) => {
                            onChange(selected);
                            onCryptoCurrencyChange(selected);
                        }}
                        formatGroupLabel={group => (
                            <CoinmarketFormOptionGroupLabel>
                                {group.label}
                            </CoinmarketFormOptionGroupLabel>
                        )}
                        formatOptionLabel={(option: CoinmarketAccountOptionsGroupOptionProps) => {
                            const networkSymbol = cryptoToNetworkSymbol(option.value);

                            return (
                                <CoinmarketFormOption>
                                    <CoinmarketFormOptionIcon symbol={option.label} />
                                    <CoinmarketFormOptionLabel>
                                        {option.label}
                                    </CoinmarketFormOptionLabel>
                                    <CoinmarketFormOptionLabelLong>
                                        {option.cryptoName}
                                    </CoinmarketFormOptionLabelLong>
                                    <CoinmarketFormOptionLabelLong>
                                        ({option.balance} {option.label})
                                    </CoinmarketFormOptionLabelLong>
                                    {option.value &&
                                        isCryptoSymbolToken(option.value) &&
                                        networkSymbol && (
                                            <CoinmarketFormOptionNetwork $elevation={elevation}>
                                                {networks[networkSymbol].name}
                                            </CoinmarketFormOptionNetwork>
                                        )}
                                </CoinmarketFormOption>
                            );
                        }}
                        data-testid="@coinmarket/form/account-select-active"
                        isClearable={false}
                        isSearchable
                    />
                )}
            />
        </>
    );
};

export default CoinmarketFormInputAccountActive;
