import type { CryptoId } from 'invity-api';

import {
    cryptoIdToNetworkAndContractAddress,
    isCryptoIdForNativeToken,
} from '@suite-common/trading';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';
import { CryptoToFiatValueBadge } from '@suite-native/trading-quote-utils';

type TradeDetailAmountStackProps = {
    isCrypto: boolean | undefined;
    amountString: string | undefined;
    amountValue: string | undefined;
    currency: string | CryptoId | undefined;
    testID?: string;
};

type CryptoIdIconProps = { cryptoId: CryptoId | undefined };

const CryptoIdIcon = ({ cryptoId }: CryptoIdIconProps) => {
    const { network, contractAddress } = cryptoIdToNetworkAndContractAddress(cryptoId);
    if (!network || !cryptoId) {
        return null;
    }

    return (
        <TokenIcon
            symbol={isCryptoIdForNativeToken(cryptoId) ? network.displaySymbol : network.symbol}
            contractAddress={contractAddress}
            size="tiny"
        />
    );
};

export const TradeDetailAmountStack = ({
    isCrypto,
    amountString,
    amountValue,
    currency,
    testID,
}: TradeDetailAmountStackProps) => (
    <VStack spacing={0}>
        <HStack alignItems="center" spacing="sp2">
            {isCrypto && <CryptoIdIcon cryptoId={currency as CryptoId} />}
            <Text variant="body-sm" testID={testID}>
                {amountString}
            </Text>
        </HStack>
        {isCrypto && (
            <CryptoToFiatValueBadge
                amount={amountValue}
                cryptoId={currency as CryptoId}
                color="contentSecondary"
                textAlign="right"
            />
        )}
    </VStack>
);
