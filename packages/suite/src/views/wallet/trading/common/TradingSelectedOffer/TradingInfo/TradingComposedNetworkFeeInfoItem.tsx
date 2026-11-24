import { useSelector } from 'react-redux';

import { selectTradingComposedTransactionInfo } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { getFeeTooltipTextId } from '#src/components/wallet/Fees/feeUtils';

import {
    TradingNetworkFeeInfoItem,
    type TradingNetworkFeeInfoItemProps,
} from './TradingNetworkFeeInfoItem';

type TradingComposedNetworkFeeInfoItemProps = {
    isLoading?: boolean;
    account: Account;
    fee: string | undefined;
    edit?: TradingNetworkFeeInfoItemProps['edit'];
};

export const TradingComposedNetworkFeeInfoItem = ({
    isLoading,
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
            isLoading={isLoading}
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
