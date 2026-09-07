import { Translation } from '@suite/intl';
import {
    type TradingProviderInfo,
    type TradingTradeType,
    getStatusUrl,
} from '@suite-common/trading';
import { type AccountKey } from '@suite-common/wallet-types';
import { Box, Column, Divider, InfoItem, Text } from '@trezor/components';

import { type Account } from 'src/types/wallet';
import { TradingDetailProviderStatusLink } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailProviderStatusLink';
import { TradingDetailTxId } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailTxId';

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
    const hasStatusUrl = !!getStatusUrl(provider, trade);

    if (!txId && !hasStatusUrl) {
        return null;
    }

    return (
        <>
            <Divider margin={{ vertical: 0 }} />
            <Box padding={20}>
                <Text typographyStyle="body-sm" as="div">
                    <Column gap={12}>
                        {!!txId && !!account && (
                            <InfoItem
                                label={<Translation id="TR_TRADING_DETAIL_TRANSACTION_ID" />}
                                direction="row"
                            >
                                <TradingDetailTxId
                                    value={txId}
                                    account={account}
                                    receiveAccountKey={receiveAccountKey}
                                />
                            </InfoItem>
                        )}
                        <TradingDetailProviderStatusLink provider={provider} trade={trade} />
                    </Column>
                </Text>
            </Box>
        </>
    );
};
