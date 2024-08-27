import { Translation, FormattedCryptoAmount } from 'src/components/suite';
import { WalletAccountTransaction } from 'src/types/wallet';
import { StakeType } from '@suite-common/wallet-types/src/stake';

import { Badge, Icon } from '@trezor/components';
import styled from 'styled-components';
import { isNetworkSymbol, NetworkSymbol } from '@suite-common/wallet-config';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { useSelector } from 'react-redux';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { getInstantStakeType } from 'src/utils/suite/stake';
import { memo } from 'react';
import { spacings, spacingsPx } from '@trezor/theme';

const Wrapper = styled.div`
    display: flex;
    gap: ${spacingsPx.xxs};
    align-items: center;
`;

const getTranslationId = (instantStakeType: StakeType) => {
    switch (instantStakeType) {
        case 'stake':
            return 'TR_STAKING_INSTANT_STAKING';
        case 'unstake':
            return 'TR_STAKING_INSTANT_UNSTAKING';
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
        <Badge size="tiny">
            <Wrapper>
                <Icon name="lightning" size={spacings.sm} />
                <FormattedCryptoAmount value={amount} symbol={symbol} />
                <Translation id={translationId} />
            </Wrapper>
        </Badge>
    );
});
