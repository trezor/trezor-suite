import { cryptoIdToNetwork, parseCryptoId } from '@suite-common/trading';
import { Account } from '@suite-common/wallet-types';
import { convertAmountUnitsToSubunits } from '@suite-common/wallet-utils';
import { Badge, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { AccountLabeling, HiddenPlaceholder } from 'src/components/suite';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { TradingAccountOptionsGroupOptionProps } from 'src/types/trading/trading';
import { tradingGetAccountLabel } from 'src/utils/wallet/trading/tradingUtils';
import { TradingCoinLogo } from 'src/views/wallet/trading/common/TradingCoinLogo';

interface TradingFormInputAccountOptionProps {
    account: Account;
    option: TradingAccountOptionsGroupOptionProps;
    decimals: number;
    isSelected: boolean;
}

export const TradingFormInputAccountOption = ({
    option,
    decimals,
    isSelected,
    account,
}: TradingFormInputAccountOptionProps) => {
    const { contractAddress } = parseCryptoId(option.value);
    const network = cryptoIdToNetwork(option.value);
    const { shouldSendInSats } = useBitcoinAmountUnit(network?.symbol);

    if (!network) return null;

    const balanceLabel = tradingGetAccountLabel(option.label, shouldSendInSats);
    const balance = shouldSendInSats
        ? convertAmountUnitsToSubunits(option.balance, decimals)
        : option.balance;

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
                    <AccountLabeling
                        account={account}
                        showAccountTypeBadge
                        accountTypeBadgeSize="small"
                    />
                )}
            </Text>
            {option.value && contractAddress && network && (
                <Badge size="small">{network.name}</Badge>
            )}
        </Row>
    );
};
