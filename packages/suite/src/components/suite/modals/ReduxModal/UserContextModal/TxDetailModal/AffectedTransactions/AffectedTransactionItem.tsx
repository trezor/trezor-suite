import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { Transaction } from '@trezor/blockchain-link-types';
import { Icon, InfoSegments, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Address, FormattedDate, HiddenPlaceholder } from 'src/components/suite';

type RowIcon = {
    txType: Transaction['type'];
    isAccountOwned: boolean | undefined;
};

const RowIcon = ({ txType, isAccountOwned }: RowIcon) => {
    const iconType = txType === 'recv' ? 'arrowDown' : 'arrowUp';

    return <Icon size={16} variant="disabled" name={isAccountOwned ? iconType : 'clock'} />;
};

type AffectedTransactionItemProps = {
    tx: WalletAccountTransaction;
    isAccountOwned?: boolean;
};

export const AffectedTransactionItem = ({ tx, isAccountOwned }: AffectedTransactionItemProps) => (
    <Row gap={spacings.sm}>
        <RowIcon isAccountOwned={isAccountOwned} txType={tx.type} />

        <InfoSegments>
            {tx.blockTime && <FormattedDate value={new Date(tx.blockTime * 1000)} date time />}

            <Text typographyStyle="hint" variant="tertiary">
                <HiddenPlaceholder>
                    <Address value={tx.txid} isTruncated />
                </HiddenPlaceholder>
            </Text>
        </InfoSegments>
    </Row>
);
