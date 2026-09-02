import { Address } from '@suite/address';
import { Translation } from '@suite/intl';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { type ArrayElement, exhaustive } from '@trezor/type-utils';

import { AccountLabelForOwnAddress } from 'src/components/suite/labeling/AccountLabelForOwnAddress';
import { type WalletAccountTransaction } from 'src/types/wallet';

type TokenTransfer = ArrayElement<WalletAccountTransaction['tokens']>;

interface TokenTransferAddressLabelProps {
    symbol: NetworkSymbol;
    transfer: TokenTransfer;
}

export const TokenTransferAddressLabel = ({ symbol, transfer }: TokenTransferAddressLabelProps) => {
    switch (transfer.type) {
        case 'sent':
            return <AccountLabelForOwnAddress address={transfer.to} symbol={symbol} />;
        case 'recv':
            return <AccountLabelForOwnAddress address={transfer.from} symbol={symbol} />;
        case 'self':
            return <Translation id="TR_SENT_TO_SELF" />;
        case 'unknown':
            return <Address value={transfer.to} isTruncated />;
        default:
            return exhaustive(transfer.type);
    }
};
