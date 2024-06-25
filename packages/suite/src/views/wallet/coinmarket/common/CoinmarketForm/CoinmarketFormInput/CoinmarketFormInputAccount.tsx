import { useSelector } from 'src/hooks/suite';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import {
    getNetworkName,
    networkToCryptoSymbol,
} from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { Controller } from 'react-hook-form';
import { CoinLogo, Select } from '@trezor/components';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketTradeBuyType } from 'src/types/coinmarket/coinmarket';
import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';
import { CoinmarketFormInputProps } from 'src/types/coinmarket/coinmarketForm';
import CoinmarketFormInputLabel from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputLabel';
import CoinmarketCoinImage from 'src/views/wallet/coinmarket/common/CoinmarketCoinImage';
import {
    CoinmarketFormInput,
    CoinmarketFormOption,
    CoinmarketFormOptionLabel,
    CoinmarketFormOptionLabelLong,
} from 'src/views/wallet/coinmarket';

const CoinmarketFormOptionTokenLogo = styled(CoinmarketCoinImage)`
    height: 18px;
`;

const CoinmarketFormOptionIcon = styled.div`
    display: flex;
    align-items: center;
    margin-right: ${spacingsPx.xs};
`;

const CoinmarketFormInputAccount = ({ label, className }: CoinmarketFormInputProps) => {
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
        <CoinmarketFormInput className={className}>
            <CoinmarketFormInputLabel label={label} />
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
                                <CoinmarketFormOptionIcon>
                                    {account.symbol.toUpperCase() === option.value ? (
                                        <CoinLogo size={18} symbol={account.symbol} />
                                    ) : (
                                        <CoinmarketFormOptionTokenLogo symbol={option.value} />
                                    )}
                                </CoinmarketFormOptionIcon>
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
