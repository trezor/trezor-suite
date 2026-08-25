import { useDispatch } from 'react-redux';

import { Address } from '@suite/address';
import { openModal } from '@suite/modal';
import { selectTransactionByAccountKeyAndTxid } from '@suite-common/wallet-core';
import { Link, type TextProps } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { type Account } from 'src/types/wallet';

type TradingDetailTxIdProps = {
    value: string;
    account: Account;
    /**
     * The other side of a swap. `receiveTxHash` holds the signed send transaction until the trade
     * status is refreshed, after which the provider replaces it with its payout transaction on the
     * receive network — so which account the transaction belongs to is only known from the store.
     */
    receiveAccount?: Account;
    intent?: TextProps['intent'];
    priority?: TextProps['priority'];
    isDisabled?: TextProps['isDisabled'];
};

export const TradingDetailTxId = ({
    value,
    account,
    receiveAccount,
    intent,
    priority,
    isDisabled,
}: TradingDetailTxIdProps) => {
    const dispatch = useDispatch();
    const isTxOnReceiveAccount = useSelector(state =>
        receiveAccount
            ? !!selectTransactionByAccountKeyAndTxid(state, receiveAccount.key, value)
            : false,
    );
    const txAccount = isTxOnReceiveAccount && receiveAccount ? receiveAccount : account;

    return (
        <Link
            onClick={() =>
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
            }
        >
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
