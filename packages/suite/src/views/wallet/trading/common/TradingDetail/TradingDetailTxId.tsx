import { useDispatch } from 'react-redux';

import { Link, TextProps } from '@trezor/components';

import { openModal } from 'src/actions/suite/modalActions';
import { Address } from 'src/components/suite';
import { Account } from 'src/types/wallet';

type TradingDetailTxIdProps = {
    value: string;
    account: Account;
    variant?: TextProps['variant'];
};

export const TradingDetailTxId = ({ value, account, variant }: TradingDetailTxIdProps) => {
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
            <Address isTruncated isChunked={false} isCopyAllowed value={value} variant={variant} />
        </Link>
    );
};
