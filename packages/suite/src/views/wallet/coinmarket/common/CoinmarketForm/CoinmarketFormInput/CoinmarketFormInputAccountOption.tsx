import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { amountToSatoshi, getNetwork } from '@suite-common/wallet-utils';
import { useElevation } from '@trezor/components';
import { HiddenPlaceholder } from 'src/components/suite';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import {
    CoinmarketAccountOptionsGroupOptionProps,
    CoinmarketAccountsOptionsGroupProps,
} from 'src/types/coinmarket/coinmarket';
import { coinmarketGetAccountLabel } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import {
    cryptoToNetworkSymbol,
    isCryptoSymbolToken,
} from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import {
    CoinmarketFormOption,
    CoinmarketFormOptionLabel,
    CoinmarketFormOptionLabelLong,
    CoinmarketFormOptionNetwork,
} from 'src/views/wallet/coinmarket';
import { CoinmarketFormOptionIcon } from 'src/views/wallet/coinmarket/common/CoinmarketCoinImage';

interface CoinmarketFormInputAccountOptionProps {
    option: CoinmarketAccountOptionsGroupOptionProps;
    optionGroups: CoinmarketAccountsOptionsGroupProps[];
    isSelected: boolean;
}

export const CoinmarketFormInputAccountOption = ({
    option,
    optionGroups,
    isSelected,
}: CoinmarketFormInputAccountOptionProps) => {
    const networkSymbol = cryptoToNetworkSymbol(option.value) as NetworkSymbol;
    const network = getNetwork(networkSymbol);
    const { shouldSendInSats } = useBitcoinAmountUnit(network?.symbol);
    const { elevation } = useElevation();

    if (!network) return null;

    const balanceLabel = coinmarketGetAccountLabel(option.label, shouldSendInSats);
    const balance = shouldSendInSats
        ? amountToSatoshi(option.balance, network.decimals)
        : option.balance;
    const accountType = optionGroups.find(group =>
        group.options.find(
            groupOption =>
                groupOption.descriptor === option.descriptor && groupOption.value === option.value,
        ),
    )?.label;

    return (
        <CoinmarketFormOption>
            <CoinmarketFormOptionIcon symbol={option.label} />
            <CoinmarketFormOptionLabel>{option.label}</CoinmarketFormOptionLabel>
            <CoinmarketFormOptionLabelLong>{option.cryptoName}</CoinmarketFormOptionLabelLong>
            <CoinmarketFormOptionLabelLong>
                {!isSelected ? (
                    <HiddenPlaceholder>
                        ({balance} {balanceLabel})
                    </HiddenPlaceholder>
                ) : (
                    accountType && `(${accountType})`
                )}
            </CoinmarketFormOptionLabelLong>
            {option.value && isCryptoSymbolToken(option.value) && networkSymbol && (
                <CoinmarketFormOptionNetwork $elevation={elevation}>
                    {networks[networkSymbol].name}
                </CoinmarketFormOptionNetwork>
            )}
        </CoinmarketFormOption>
    );
};
