import { AccountLabel } from '@suite/account';
import { Address } from '@suite/address';
import { type Account } from '@suite-common/wallet-types';
import { isUtxoBased } from '@suite-common/wallet-utils';
import { Column, Row } from '@trezor/components';
import { TokenIcon } from '@trezor/product-components';

import { CoinBalance } from 'src/components/suite';

// the select menu sizes itself to its content, so the label has to be capped for it not to
// outgrow the modal on a long custom account label
const MAX_LABEL_WIDTH = 200;

type WalletConnectAccountOptionProps = {
    account: Account;
};

export const WalletConnectAccountOption = ({ account }: WalletConnectAccountOptionProps) => (
    <Row gap={16} justifyContent="space-between" width="100%">
        <Row gap={12} flex="1" minWidth={0} overflow="hidden">
            <TokenIcon symbol={account.symbol} size={24} />
            <Column alignItems="flex-start" minWidth={0} overflow="hidden">
                <AccountLabel
                    account={account}
                    showAccountTypeBadge
                    accountTypeBadgeSize="small"
                    rowProps={{ maxWidth: MAX_LABEL_WIDTH }}
                />
                {/* the descriptor of a UTXO account is an xpub, not an address */}
                {!isUtxoBased(account) && (
                    <Address
                        value={account.descriptor}
                        intent="neutral"
                        priority="secondary"
                        typographyStyle="body-sm"
                        isTruncated
                    />
                )}
            </Column>
        </Row>
        <Row flex="none">
            <CoinBalance value={account.formattedBalance} symbol={account.symbol} />
        </Row>
    </Row>
);
