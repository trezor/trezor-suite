import { useDispatch } from 'react-redux';

import { Link, type TextProps } from '@trezor/components';

import { openModal } from 'src/actions/suite/modalActions';
import { Address } from 'src/components/suite';
import { Account } from 'src/types/wallet';

type TradingDetailTxIdProps = {
    value: string;
    account: Account;
    intent?: TextProps['intent'];
    priority?: TextProps['priority'];
    isDisabled?: TextProps['isDisabled'];
};

export const TradingDetailTxId = ({
    value,
    account,
    intent,
    priority,
    isDisabled,
}: TradingDetailTxIdProps) => {
    const dispatch = useDispatch();

    return (
        <Link
            onClick={() =>
                dispatch(
                    openModal({
                        type: 'transaction-detail',
                        txid: value,
                        descriptor: account.descriptor,
                        symbol: account.symbol,
                        deviceState: account.deviceState,
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
