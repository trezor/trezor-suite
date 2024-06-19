import { useSelector } from 'src/hooks/suite';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import {
    cryptoToCoinSymbol,
    cryptoToNetworkSymbol,
    isCryptoSymbolToken,
} from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { Controller } from 'react-hook-form';
import { Select, useElevation } from '@trezor/components';
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

interface BuildOptionsProps {
    symbolsInfo: CryptoSymbolInfo[] | undefined;
    cryptoCurrencies: Set<CryptoSymbol>;
}

interface OptionsGroupProps {
    label: string;
    options: CoinmarketCryptoListProps[];
}

const buildOptions = ({ symbolsInfo, cryptoCurrencies }: BuildOptionsProps) => {
    const groups: OptionsGroupProps[] = [
        {
            label: 'Popular cryptocurrencies',
            options: [],
        },
        {
            label: 'Ethereum ERC20 tokens',
            options: [],
        },
        {
            label: 'Solana tokens',
            options: [],
        },
        {
            label: 'Polygon ERC20 tokens',
            options: [],
        },
        {
            label: 'Other currencies',
            options: [],
        },
    ];

    cryptoCurrencies.forEach(symbol => {
        const coinSymbol = cryptoToCoinSymbol(symbol);
        const symbolInfo = symbolsInfo?.find(symbolInfoItem => symbolInfoItem.symbol === symbol);
        const cryptoSymbol = cryptoToNetworkSymbol(symbol);

        const option = {
            value: symbol,
            label: coinSymbol.toUpperCase(),
            cryptoName: symbolInfo?.name ?? null,
        };

        if (symbolInfo?.category === 'Popular currencies') {
            groups[0].options.push(option);

            return;
        }

        if (isCryptoSymbolToken(symbol) && cryptoSymbol === 'eth') {
            groups[1].options.push(option);

            return;
        }

        if (isCryptoSymbolToken(symbol) && cryptoSymbol === 'sol') {
            groups[2].options.push(option);

            return;
        }

        if (isCryptoSymbolToken(symbol) && cryptoSymbol === 'matic') {
            groups[3].options.push(option);

            return;
        }

        groups[4].options.push(option);
    });

    return groups;
};

const CoinmarketFormInputAccount = () => {
    const { selectedAccount } = useSelector(state => state.wallet);
    const { shouldSendInSats } = useBitcoinAmountUnit(selectedAccount.account?.symbol);
    const { elevation } = useElevation();

    const { control, buyInfo } = useCoinmarketFormContext<CoinmarketTradeBuyType>();
    const { symbolsInfo } = useSelector(state => state.wallet.coinmarket.info);

    const options = useMemo(
        () =>
            buildOptions({
                symbolsInfo,
                cryptoCurrencies: buyInfo?.supportedCryptoCurrencies ?? new Set(),
            }),
        [buyInfo?.supportedCryptoCurrencies, symbolsInfo],
    );

    return (
        <CoinmarketFormInput className={className}>
            <CoinmarketFormInputLabel label={label} />
            <Controller
                name="cryptoSelect"
                control={control}
                render={({ field: { onChange, value } }) => (
                    <Select
                        value={value}
                        options={options}
                        onChange={(selected: CoinmarketCryptoListProps) => {
                            onChange(selected);
                        }}
                        formatOptionLabel={(
                            option: ReturnType<typeof buildOptions>[number]['options'][number],
                        ) => (
                            <CoinmarketFormOption>
                                <CoinmarketFormOptionTokenLogo symbol={option.label} />
                                <CoinmarketFormOptionLabel>
                                    {shouldSendInSats ? 'sats' : option.label}
                                </CoinmarketFormOptionLabel>
                                <CoinmarketFormOptionLabelLong>
                                    {option.cryptoName}
                                </CoinmarketFormOptionLabelLong>
                                {option.value &&
                                    isCryptoSymbolToken(option.value) &&
                                    cryptoToNetworkSymbol(option.value) && (
                                        <CoinmarketFormOptionNetwork $elevation={elevation}>
                                            {networks[cryptoToNetworkSymbol(option.value)!].name}
                                        </CoinmarketFormOptionNetwork>
                                    )}
                            </CoinmarketFormOption>
                        )}
                        data-test="@coinmarket/form/account-select"
                        isClearable={false}
                        isSearchable
                    />
                )}
            />
        </CoinmarketFormInput>
    );
};

export default CoinmarketFormInputAccount;
