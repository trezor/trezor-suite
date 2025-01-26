import { amountToSmallestUnit } from '@suite-common/wallet-utils';
import { Row, Text, Badge } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { HiddenPlaceholder } from 'src/components/suite';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import {
    TradingAccountOptionsGroupOptionProps,
    TradingAccountsOptionsGroupProps,
} from 'src/types/trading/trading';
import {
    tradingGetAccountLabel,
    cryptoIdToNetwork,
    parseCryptoId,
} from 'src/utils/wallet/trading/tradingUtils';
import { TradingCoinLogo } from 'src/views/wallet/trading/common/TradingCoinLogo';

interface TradingFormInputAccountOptionProps {
    option: TradingAccountOptionsGroupOptionProps;
    optionGroups: TradingAccountsOptionsGroupProps[];
    decimals: number;
    isSelected: boolean;
}

export const TradingFormInputAccountOption = ({
    option,
    optionGroups,
    decimals,
    isSelected,
}: TradingFormInputAccountOptionProps) => {
    const { contractAddress } = parseCryptoId(option.value);
    const network = cryptoIdToNetwork(option.value);
    const { shouldSendInSats } = useBitcoinAmountUnit(network?.symbol);

    if (!network) return null;

    const balanceLabel = tradingGetAccountLabel(option.label, shouldSendInSats);
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
            <TradingCoinLogo cryptoId={option.value} size={20} />
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
