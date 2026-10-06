import {
    type TradingProviderInfo,
    type TradingTradeType,
    getStatusUrl,
} from '@suite-common/trading';
import { type AccountKey } from '@suite-common/wallet-types';
import { Box, Column, Divider, Text } from '@trezor/components';

import { type Account } from 'src/types/wallet';
import { TradingDetailProviderStatusLink } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailProviderStatusLink';
import { TradingDetailTransactionIdRow } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailTransactionIdRow';

type TradingDetailTerminalDetailsProps = {
    provider?: TradingProviderInfo;
    trade: TradingTradeType;
    account?: Account;
    receiveAccountKey?: AccountKey;
    txId?: string;
};

export const TradingDetailTerminalDetails = ({
    provider,
    trade,
    account,
    receiveAccountKey,
    txId,
}: TradingDetailTerminalDetailsProps) => {
    const hasTxId = !!txId && !!account;
    const hasStatusUrl = !!getStatusUrl(provider, trade);

    if (!hasTxId && !hasStatusUrl) {
        return null;
    }

    return (
        <>
            <Divider margin={{ vertical: 0 }} />
            <Box padding={20}>
                <Text typographyStyle="body-sm" as="div">
                    <Column gap={12}>
                        <TradingDetailTransactionIdRow
                            txId={txId}
                            account={account}
                            receiveAccountKey={receiveAccountKey}
                        />
                        <TradingDetailProviderStatusLink provider={provider} trade={trade} />
                    </Column>
                </Text>
            </Box>
        </>
    );
};
