import { Address } from '@suite/address';
import { HiddenPlaceholder } from '@suite/discreet-mode';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { type Transaction } from '@trezor/blockchain-link-types';
import { Icon, InfoSegments, Row, Text } from '@trezor/components';
import { ArrowDownIcon, ArrowUpIcon, ClockIcon } from '@trezor/icons';
import { spacings } from '@trezor/theme';

import { FormattedDate } from 'src/components/suite/FormattedDate';

type RowIcon = {
    txType: Transaction['type'];
    isAccountOwned: boolean | undefined;
};

const RowIcon = ({ txType, isAccountOwned }: RowIcon) => {
    const icon = txType === 'recv' ? ArrowDownIcon : ArrowUpIcon;

    return <Icon size={16} isDisabled={true} as={isAccountOwned ? icon : ClockIcon} />;
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

            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                <HiddenPlaceholder>
                    <Address value={tx.txid} isTruncated />
                </HiddenPlaceholder>
            </Text>
        </InfoSegments>
    </Row>
);
