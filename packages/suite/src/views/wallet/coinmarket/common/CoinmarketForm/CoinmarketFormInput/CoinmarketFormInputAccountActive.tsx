import { useSelector } from 'src/hooks/suite';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import {
    cryptoToNetworkSymbol,
    isCryptoSymbolToken,
} from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { Controller } from 'react-hook-form';
import { Select, useElevation } from '@trezor/components';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import {
    CoinmarketAccountOptionsGroupOptionProps,
    CoinmarketTradeSellType,
} from 'src/types/coinmarket/coinmarket';
import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';
import { networks } from '@suite-common/wallet-config';
import CoinmarketCoinImage from 'src/views/wallet/coinmarket/common/CoinmarketCoinImage';
import {
    CoinmarketFormInput,
    CoinmarketFormOption,
    CoinmarketFormOptionLabel,
    CoinmarketFormOptionLabelLong,
    CoinmarketFormOptionNetwork,
} from 'src/views/wallet/coinmarket';
import CoinmarketFormInputLabel from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputLabel';
import { CoinmarketFormInputProps } from 'src/types/coinmarket/coinmarketForm';
import { FORM_CRYPTO_CURRENCY_SELECT } from 'src/constants/wallet/coinmarket/form';
import { useCoinmarketBuildAccountGroups } from 'src/hooks/wallet/coinmarket/form/useCoinmarketSellFormDefaultValues';

const CoinmarketFormOptionTokenLogo = styled(CoinmarketCoinImage)`
    height: 18px;
`;

const CoinmarketFormOptionIcon = styled(CoinmarketFormOptionTokenLogo)`
    display: flex;
    align-items: center;
    margin-right: ${spacingsPx.xs};
`;

const CoinmarketFormInputAccountActive = ({ className, label }: CoinmarketFormInputProps) => {
    const {
        form: {
            helpers: { onCryptoCurrencyChange },
        },
    } = useCoinmarketFormContext<CoinmarketTradeSellType>();
    const { selectedAccount } = useSelector(state => state.wallet);
    const { shouldSendInSats } = useBitcoinAmountUnit(selectedAccount.account?.symbol);
    const { elevation } = useElevation();
    const { control } = useCoinmarketFormContext();
    const optionGroups = useCoinmarketBuildAccountGroups();

    return (
        <CoinmarketFormInput className={className}>
            <CoinmarketFormInputLabel label={label} />
            <Controller
                name={FORM_CRYPTO_CURRENCY_SELECT}
                control={control}
                render={({ field: { onChange, value } }) => (
                    <Select
                        value={value}
                        options={optionGroups}
                        onChange={(selected: CoinmarketAccountOptionsGroupOptionProps) => {
                            onChange(selected);
                            onCryptoCurrencyChange(selected);
                        }}
                        formatOptionLabel={(option: CoinmarketAccountOptionsGroupOptionProps) => {
                            const networkSymbol = cryptoToNetworkSymbol(option.value);

                            return (
                                <CoinmarketFormOption>
                                    <CoinmarketFormOptionIcon symbol={option.label} />
                                    <CoinmarketFormOptionLabel>
                                        {shouldSendInSats ? 'sats' : option.label}
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
                        data-test="@coinmarket/form/account-select"
                        isClearable={false}
                        isSearchable
                    />
                )}
            />
        </CoinmarketFormInput>
    );
};

export default CoinmarketFormInputAccountActive;
