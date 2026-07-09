import type { CryptoId } from 'invity-api';

import {
    cryptoIdToNetworkAndContractAddress,
    isCryptoIdForNativeToken,
} from '@suite-common/trading';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { TokenLogo } from '@suite-native/icons';
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

    const isNativeToken = isCryptoIdForNativeToken(cryptoId);

    return (
        <TokenLogo
            symbol={isNativeToken ? (network.displaySymbol as NetworkSymbol) : network.symbol}
            contractAddress={isNativeToken ? undefined : contractAddress}
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
