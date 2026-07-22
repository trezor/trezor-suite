import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Card, HStack, Text } from '@suite-native/atoms';
import { NetworkIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

type YieldDepositTxSimulationHeaderProps = {
    accountLabel?: string;
    networkSymbol: NetworkSymbol;
};

export const YieldDepositTxSimulationHeader = ({
    accountLabel,
    networkSymbol,
}: YieldDepositTxSimulationHeaderProps) => (
    <>
        <Text variant="body-sm" color="contentSecondary" textAlign="center">
            <Translation
                id="moduleConnectPopup.simulation.simulationPoweredBy"
                values={{ provider: 'Blockaid' }}
            />
        </Text>
        <Card noPadding>
            <HStack padding="sp16" justifyContent="space-between" alignItems="center">
                <Text variant="body-sm" color="contentSecondary">
                    <Translation id="moduleTrading.exchangeTradePreviewCard.account" />
                </Text>
                <HStack spacing="sp8" alignItems="center">
                    <NetworkIcon symbol={networkSymbol} size={20} />
                    <Text variant="body-sm">{accountLabel}</Text>
                </HStack>
            </HStack>
        </Card>
    </>
);
