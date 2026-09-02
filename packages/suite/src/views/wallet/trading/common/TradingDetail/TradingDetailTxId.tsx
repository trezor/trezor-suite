import { Address } from '@suite/address';
import { openModal } from '@suite/modal';
import { useDispatch } from '@suite-common/redux-utils';
import {
    selectAccountByKey,
    selectTransactionByAccountKeyAndTxid,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Link, type TextProps } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { type Account } from 'src/types/wallet';

type TradingDetailTxIdProps = {
    value: string;
    account: Account;
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
    const txAccount = payoutAccount ?? account;

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
