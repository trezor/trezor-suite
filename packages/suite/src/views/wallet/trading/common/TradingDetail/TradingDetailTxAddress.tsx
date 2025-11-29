import { useDispatch } from 'react-redux';

import { Link, Text, TextVariant } from '@trezor/components';

import { openModal } from 'src/actions/suite/modalActions';
import { Account } from 'src/types/wallet';

type TradingDetailTxAddressProps = {
    address: string;
    account: Account;
    variant?: TextVariant;
};

export const TradingDetailTxAddress = ({
    address,
    account,
    variant,
}: TradingDetailTxAddressProps) => {
    const dispatch = useDispatch();

    return (
        <Link
            variant="underline"
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
            <Text maxWidth={150} ellipsisLineCount={1} variant={variant}>
                {address}
            </Text>
        </Link>
    );
};
