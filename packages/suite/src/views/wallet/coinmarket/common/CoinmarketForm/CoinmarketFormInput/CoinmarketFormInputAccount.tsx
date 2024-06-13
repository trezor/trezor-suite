import { useSelector } from 'src/hooks/suite';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import {
    getNetworkName,
    networkToCryptoSymbol,
} from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import {
    CoinmarketFormInput,
    CoinmarketFormInputLabel,
    CoinmarketFormOption,
    CoinmarketFormOptionLabel,
    CoinmarketFormOptionLabelLong,
    CoinmarketFormOptionTokenLogo,
} from '../../..';
import { Controller } from 'react-hook-form';
import { CoinLogo, Select } from '@trezor/components';
import invityAPI from 'src/services/suite/invityAPI';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketTradeBuyType } from 'src/types/coinmarket/coinmarket';
import { Translation } from 'src/components/suite';

const CoinmarketFormInputAccount = () => {
    const account = useSelector(state => state.wallet.selectedAccount.account);
    const { shouldSendInSats } = useBitcoinAmountUnit(account?.symbol);
    const { control } = useCoinmarketFormContext<CoinmarketTradeBuyType>();

    if (!account) return null;
    const cryptoSymbol = networkToCryptoSymbol(account.symbol)!;
    const cryptoList = [
        {
            value: cryptoSymbol,
            label: cryptoSymbol,
            cryptoSymbol,
            cryptoName: getNetworkName(account.symbol),
        },
    ];

    return (
        <CoinmarketFormInput>
            <CoinmarketFormInputLabel>
                <Translation id="TR_COINMARKET_YOU_BUY" />
            </CoinmarketFormInputLabel>
            <Controller
                name="cryptoSelect"
                defaultValue={cryptoList[0]}
                control={control}
                render={({ field: { onChange, value } }) => (
                    <Select
                        value={value}
                        options={cryptoList}
                        onChange={(selected: any) => {
                            console.log(selected, value, control);
                            onChange(selected);
                        }}
                        formatOptionLabel={(option: (typeof cryptoList)[number]) => (
                            <CoinmarketFormOption>
                                {account.symbol.toUpperCase() === option.value ? (
                                    <CoinLogo size={18} symbol={account.symbol} />
                                ) : (
                                    <CoinmarketFormOptionTokenLogo
                                        src={invityAPI.getCoinLogoUrl(option.value)}
                                    />
                                )}
                                <CoinmarketFormOptionLabel>
                                    {shouldSendInSats ? 'sats' : option.label}
                                </CoinmarketFormOptionLabel>
                                <CoinmarketFormOptionLabelLong>
                                    {option.cryptoName}
                                </CoinmarketFormOptionLabelLong>
                            </CoinmarketFormOption>
                        )}
                        data-test="@coinmarket/form/account-select"
                        isClearable={false}
                        isSearchable
                        isDisabled
                    />
                )}
            />
        </CoinmarketFormInput>
    );
};

export default CoinmarketFormInputAccount;
