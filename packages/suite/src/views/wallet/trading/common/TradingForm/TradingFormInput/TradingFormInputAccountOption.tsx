import { amountToSmallestUnit } from '@suite-common/wallet-utils';
import { Row, Text, Badge } from '@trezor/components';
import { spacings } from '@trezor/theme';

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
import { CoinmarketCoinLogo } from 'src/views/wallet/coinmarket/common/CoinmarketCoinLogo';

interface CoinmarketFormInputAccountOptionProps {
    option: CoinmarketAccountOptionsGroupOptionProps;
    optionGroups: CoinmarketAccountsOptionsGroupProps[];
    decimals: number;
    isSelected: boolean;
}

export const CoinmarketFormInputAccountOption = ({
    option,
    optionGroups,
    decimals,
    isSelected,
}: CoinmarketFormInputAccountOptionProps) => {
    const { contractAddress } = parseCryptoId(option.value);
    const network = cryptoIdToNetwork(option.value);
    const { shouldSendInSats } = useBitcoinAmountUnit(network?.symbol);

    if (!network) return null;

    const balanceLabel = coinmarketGetAccountLabel(option.label, shouldSendInSats);
    const balance = shouldSendInSats
        ? amountToSmallestUnit(option.balance, decimals)
        : option.balance;
    const accountType = optionGroups.find(group =>
        group.options.find(
            groupOption =>
                groupOption.descriptor === option.descriptor && groupOption.value === option.value,
        ),
    )?.label;

    return (
        <Row gap={spacings.sm}>
            <CoinmarketCoinLogo cryptoId={option.value} size={20} />
            <Text>{option.label}</Text>
            <Text variant="tertiary" typographyStyle="label">
                {option.cryptoName}
            </Text>
            <Text variant="tertiary" typographyStyle="label">
                {!isSelected ? (
                    <HiddenPlaceholder>
                        ({balance} {balanceLabel})
                    </HiddenPlaceholder>
                ) : (
                    accountType && `(${accountType})`
                )}
            </Text>
            {option.value && contractAddress && network && (
                <Badge size="small">{network.name}</Badge>
            )}
        </Row>
    );
};
