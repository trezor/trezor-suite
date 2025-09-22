import { TradingVerifyFormAccountOptionProps } from 'src/types/trading/tradingVerify';

import { TradingReceiveAccountAddSuiteOption } from './TradingReceiveAccountAddSuiteOption';
import { TradingReceiveAccountNonSuiteOption } from './TradingReceiveAccountNonSuiteOption';
import { TradingReceiveAccountSuiteOption } from './TradingReceiveAccountSuiteOption';

interface TradingReceiveAccountOptionProps {
    option: TradingVerifyFormAccountOptionProps;
}

export const TradingReceiveAccountOption = ({ option }: TradingReceiveAccountOptionProps) => {
    if (option.type === 'SUITE' && option.account) {
        return <TradingReceiveAccountSuiteOption option={option} account={option.account} />;
    }

    if (option.type === 'ADD_SUITE') {
        return <TradingReceiveAccountAddSuiteOption />;
    }

    if (option.type === 'NON_SUITE') {
        return <TradingReceiveAccountNonSuiteOption />;
    }

    return null;
};
