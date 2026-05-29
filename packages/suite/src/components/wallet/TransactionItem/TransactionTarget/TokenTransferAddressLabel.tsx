import { Address } from '@suite/address';
import { Translation } from '@suite/intl';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { type ArrayElement } from '@trezor/type-utils';

import { AccountLabelForOwnAddress } from 'src/components/suite/labeling/AccountLabelForOwnAddress';
import { type WalletAccountTransaction } from 'src/types/wallet';

interface TokenTransferAddressLabelProps {
    symbol: NetworkSymbol;
    transfer: ArrayElement<WalletAccountTransaction['tokens']>;
    type: WalletAccountTransaction['type'];
}

export const TokenTransferAddressLabel = ({
    symbol,
    transfer,
    type,
}: TokenTransferAddressLabelProps) => {
    if (type === 'self') {
        return <Translation id="TR_SENT_TO_SELF" />;
    }
    if (type === 'sent') {
        return <AccountLabelForOwnAddress address={transfer.to} symbol={symbol} />;
    }

    return <Address value={transfer.to} isTruncated />;
};
