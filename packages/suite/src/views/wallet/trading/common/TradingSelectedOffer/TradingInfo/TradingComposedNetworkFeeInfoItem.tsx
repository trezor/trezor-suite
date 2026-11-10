import { useSelector } from 'react-redux';

import { selectTradingComposedTransactionInfo } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import {
    TradingNetworkFeeInfoItem,
    type TradingNetworkFeeInfoItemProps,
} from './TradingNetworkFeeInfoItem';
import { getFeeTooltipTextId } from '../../../../../../components/wallet/Fees/feeUtils';

type TradingComposedNetworkFeeInfoItemProps = {
    account: Account;
    fee: string | undefined;
    edit?: TradingNetworkFeeInfoItemProps['edit'];
};

export const TradingComposedNetworkFeeInfoItem = ({
    account,
    fee,
    edit,
}: TradingComposedNetworkFeeInfoItemProps) => {
    const { composed } = useSelector(selectTradingComposedTransactionInfo);

    const amount = subunitsToUnits({
        value: asAmountSubunit(new BigNumber(fee || '0')),
        symbol: account.symbol,
    }).toString();

    return (
        <TradingNetworkFeeInfoItem
            amount={amount}
            symbol={account.symbol}
            tooltipTextId={getFeeTooltipTextId({
                networkType: account.networkType,
                isTronAccountActivation: !!composed?.accountActivationFee,
            })}
            edit={edit}
        />
    );
};
