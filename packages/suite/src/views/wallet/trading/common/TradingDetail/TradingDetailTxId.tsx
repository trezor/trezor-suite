import { Address } from '@suite/address';
import { openModal } from '@suite/modal';
import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import {
    selectAccountByKey,
    selectTransactionByAccountKeyAndTxid,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Icon, Link, Row } from '@trezor/components';
import { CaretRightIcon } from '@trezor/icons';

import { useSelector } from 'src/hooks/suite';
import { type Account } from 'src/types/wallet';

type TradingDetailTxIdProps = {
    value: string;
    account: Account;
    receiveAccountKey?: AccountKey;
};

export const TradingDetailTxId = ({
    value,
    account,
    receiveAccountKey,
}: TradingDetailTxIdProps) => {
    const { dispatch } = useServices(selectDispatch);

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
            <Row gap={4}>
                <Address isTruncated isChunked={false} isCopyAllowed value={value} intent="brand" />
                <Icon as={CaretRightIcon} size={16} intent="brand" />
            </Row>
        </Link>
    );
};
