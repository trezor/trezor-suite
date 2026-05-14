import { useSelector } from 'react-redux';

import {
    type TradingRootState,
    type TradingType,
    selectTradingLastErrorMessageByTradeType,
} from '@suite-common/trading';

import { GeneralAlert } from '../GeneralAlert';

export type LastErrorMessageProps = {
    tradingType: TradingType;
};

export const LastErrorMessage = ({ tradingType }: LastErrorMessageProps) => {
    const lastErrorMessage = useSelector((state: TradingRootState) =>
        selectTradingLastErrorMessageByTradeType(state, tradingType),
    );

    return <GeneralAlert text={lastErrorMessage} />;
};
