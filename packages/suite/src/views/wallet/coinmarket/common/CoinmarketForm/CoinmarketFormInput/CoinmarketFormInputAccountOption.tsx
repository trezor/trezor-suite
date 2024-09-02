import { amountToSatoshi } from '@suite-common/wallet-utils';
import { useElevation } from '@trezor/components';
import { HiddenPlaceholder } from 'src/components/suite';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import {
    CoinmarketAccountOptionsGroupOptionProps,
    CoinmarketAccountsOptionsGroupProps,
} from 'src/types/coinmarket/coinmarket';
import {
    coinmarketGetAccountLabel,
    cryptoIdToNetwork,
    parseCryptoId,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';
import {
    CoinmarketFormOption,
    CoinmarketFormOptionLabel,
    CoinmarketFormOptionLabelLong,
    CoinmarketFormOptionLogo,
    CoinmarketFormOptionNetwork,
} from 'src/views/wallet/coinmarket';

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
    const { contractAddress } = parseCryptoId(option.value);
    const network = cryptoIdToNetwork(option.value);

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
            <CoinmarketFormOptionLogo cryptoId={option.value} size={20} />
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
            {option.value && contractAddress && network && (
                <CoinmarketFormOptionNetwork $elevation={elevation}>
                    {network.name}
                </CoinmarketFormOptionNetwork>
            )}
        </CoinmarketFormOption>
    );
};
