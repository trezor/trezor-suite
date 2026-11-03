import { generateTradeApiInstallSalt } from '@suite-common/trading';

export const migrateTradingAddTradeApiInstallSalt = <T extends object | undefined>(
    oldState: T,
): T => {
    if (!oldState || ('tradeApiInstallSalt' in oldState && oldState.tradeApiInstallSalt)) {
        return oldState;
    }

    return { ...oldState, tradeApiInstallSalt: generateTradeApiInstallSalt() };
};
