import { useSelector } from 'react-redux';

import { DebugOnlyBadge, selectIsDebugModeActive } from '@suite/debug';
import { Translation } from '@suite/intl';
import { toTokenAddress } from '@suite-common/tokens';
import {
    type TradingFormAccountRootState,
    parseCryptoId,
    requiresTokenApproval,
    selectTradingExchangeSelectedQuote,
    selectTradingSendAccount,
    useTradingExchangeAllowance,
} from '@suite-common/trading';
import { findToken } from '@suite-common/wallet-utils';
import { Row, Text } from '@trezor/components';

import { AllowanceAmount } from '#src/components/wallet/Allowance/AllowanceAmount';

import { TradingExchangeAllowanceSourceInfo } from './TradingExchangeAllowanceSourceInfo';

export const TradingExchangeAllowanceDebug = () => {
    const isDebug = useSelector(selectIsDebugModeActive);
    const account = useSelector((state: TradingFormAccountRootState) =>
        selectTradingSendAccount(state, 'exchange'),
    );
    const quote = useSelector(selectTradingExchangeSelectedQuote);
    const { allowance, currentAllowance, isFirstReadRunning } = useTradingExchangeAllowance({
        account,
    });

    if (!isDebug || !account || !quote?.send || !requiresTokenApproval(quote)) {
        return null;
    }

    const { contractAddress } = parseCryptoId(quote.send);
    const token = findToken(account.tokens, contractAddress);

    if (!token?.symbol) {
        return null;
    }

    return (
        <Row
            alignItems="center"
            justifyContent="space-between"
            padding={{ vertical: 20, horizontal: 16 }}
            data-testid="@trading/form/allowance-debug"
        >
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                <DebugOnlyBadge>
                    <Translation id="TR_EXCHANGE_ALLOWANCE_APPROVED_AMOUNT" />
                </DebugOnlyBadge>
            </Text>
            <Row gap={8}>
                <AllowanceAmount
                    amount={currentAllowance.amount}
                    networkSymbol={account.symbol}
                    contractAddress={toTokenAddress(token.contract)}
                    isCompact
                    typographyStyle="body-sm"
                    isLoading={isFirstReadRunning}
                />
                <TradingExchangeAllowanceSourceInfo
                    source={currentAllowance.source}
                    allowance={allowance}
                    data-testid="@trading/form/allowance-debug-info"
                />
            </Row>
        </Row>
    );
};
