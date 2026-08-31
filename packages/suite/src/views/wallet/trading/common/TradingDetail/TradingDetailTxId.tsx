import { useDispatch } from 'react-redux';

import { Address } from '@suite/address';
import { useExternalLink } from '@suite/external-links';
import { openModal } from '@suite/modal';
import { getTxExplorerUrl } from '@suite-common/wallet-config';
import {
    selectAccountByKey,
    selectExplorer,
    selectTransactionByAccountKeyAndTxid,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Link, type TextProps } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { type Account } from 'src/types/wallet';

type TradingDetailTxIdProps = {
    value: string;
    account: Account;
    /**
     * The other side of a swap. `receiveTxHash` holds the signed send transaction until a status
     * refresh replaces it with the provider's payout on the receive network, so only the store says
     * which account the transaction belongs to.
     */
    receiveAccountKey?: AccountKey;
    intent?: TextProps['intent'];
    priority?: TextProps['priority'];
    isDisabled?: TextProps['isDisabled'];
};

export const TradingDetailTxId = ({
    value,
    account,
    receiveAccountKey,
    intent,
    priority,
    isDisabled,
}: TradingDetailTxIdProps) => {
    const dispatch = useDispatch();

    const payoutAccount = useSelector(state =>
        receiveAccountKey && selectTransactionByAccountKeyAndTxid(state, receiveAccountKey, value)
            ? selectAccountByKey(state, receiveAccountKey)
            : null,
    );
    const isInSendAccount = useSelector(
        state => !!selectTransactionByAccountKeyAndTxid(state, account.key, value),
    );
    const txAccount = payoutAccount ?? (isInSendAccount ? account : null);

    const explorer = useSelector(state => selectExplorer(state, account.symbol));
    // The transaction detail reads the transaction from the store, so it opens only for a
    // transaction an account has loaded. Anything else goes to the explorer of its network.
    const explorerUrl = useExternalLink(txAccount ? undefined : getTxExplorerUrl(explorer, value));

    const openTransactionDetail = txAccount
        ? () =>
              dispatch(
                  openModal({
                      type: 'transaction-detail',
                      txid: value,
                      descriptor: txAccount.descriptor,
                      symbol: txAccount.symbol,
                      deviceState: txAccount.deviceState,
                      flow: 'detail',
                  }),
              )
        : undefined;

    return (
        <Link href={explorerUrl} onClick={openTransactionDetail}>
            <Address
                isTruncated
                isChunked={false}
                isCopyAllowed
                value={value}
                intent={intent}
                priority={priority}
                isDisabled={isDisabled}
            />
        </Link>
    );
};
