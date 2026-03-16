import { memo } from 'react';
import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { getInstantStakeType } from '@suite-common/staking';
import { type NetworkSymbol, isNetworkSymbol } from '@suite-common/wallet-config';
import { type StakeType } from '@suite-common/wallet-types';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { Badge, Row } from '@trezor/components';

import { FormattedCryptoAmount } from 'src/components/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { type WalletAccountTransaction } from 'src/types/wallet';

const getTranslationId = (instantStakeType: StakeType) => {
    switch (instantStakeType) {
        case 'stake':
            return 'TR_INSTANT_STAKING';
        case 'unstake':
            return 'TR_INSTANT_UNSTAKING';
        default:
            return null; // there is no badge for claiming
    }
};

const getInternalTransaction = (
    transaction: WalletAccountTransaction,
    selectedAccountDescriptor: string,
    symbol: NetworkSymbol,
) =>
    transaction.internalTransfers.find(internalTx =>
        getInstantStakeType(internalTx, selectedAccountDescriptor, symbol),
    );

interface InstantStakeBadgeProps {
    transaction: WalletAccountTransaction;
    symbol: string | undefined;
}

export const InstantStakeBadge = memo(({ transaction, symbol }: InstantStakeBadgeProps) => {
    const { descriptor: selectedAccountAddress } = useSelector(selectSelectedAccount) || {};

    if (!selectedAccountAddress || !symbol || !isNetworkSymbol(symbol)) return null;

    const internalTx = getInternalTransaction(transaction, selectedAccountAddress, symbol);
    if (!internalTx) return null;

    const instantStakeType = getInstantStakeType(internalTx, selectedAccountAddress, symbol);
    if (!instantStakeType) return null;

    const translationId = getTranslationId(instantStakeType);
    if (!translationId) return null;

    const amount = internalTx.amount && formatNetworkAmount(internalTx.amount, symbol);

    return (
        <Badge size="small" iconLeft="lightning">
            <Row gap={4}>
                <FormattedCryptoAmount value={amount} symbol={symbol} />
                <Translation id={translationId} />
            </Row>
        </Badge>
    );
});
