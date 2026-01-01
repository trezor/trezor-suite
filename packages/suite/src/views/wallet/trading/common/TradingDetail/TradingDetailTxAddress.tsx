import { useDispatch } from 'react-redux';

import { Link } from '@trezor/components';

import { openModal } from 'src/actions/suite/modalActions';
import { Address } from 'src/components/suite';
import { Account } from 'src/types/wallet';

type TradingDetailTxAddressProps = {
    address: string;
    account: Account;
};

export const TradingDetailTxAddress = ({ address, account }: TradingDetailTxAddressProps) => {
    const dispatch = useDispatch();

    return (
        <Link
            onClick={() =>
                dispatch(
                    openModal({
                        type: 'transaction-detail',
                        txid: address,
                        descriptor: account.descriptor,
                        symbol: account.symbol,
                        deviceState: account.deviceState,
                        flow: 'detail',
                    }),
                )
            }
        >
            <Address value={address} isTruncated />
        </Link>
    );
};
