import { useTimer } from '@trezor/react-utils';
import { useServerEnvironment } from '../useServerEnviroment';
import { useDevice } from 'src/hooks/suite';
import { InvityAPIReloadQuotesAfterSeconds } from 'src/constants/wallet/coinmarket/metadata';
import { useState } from 'react';
import {
    CoinmarketTradeDetailMapProps,
    CoinmarketTradeType,
    UseCoinmarketProps,
} from 'src/types/coinmarket/coinmarket';

export const useCoinmarketCommonOffers = <T extends CoinmarketTradeType>({
    selectedAccount,
}: UseCoinmarketProps) => {
    const timer = useTimer();
    const { account } = selectedAccount;
    const { isLocked, device } = useDevice();
    const [callInProgress, setCallInProgress] = useState<boolean>(isLocked() ?? false);
    const [selectedQuote, setSelectedQuote] = useState<CoinmarketTradeDetailMapProps[T]>();

    const checkQuotesTimer = (callback: () => Promise<void>) => {
        if (!timer.isLoading && !timer.isStopped) {
            if (timer.resetCount >= 40) {
                timer.stop();
            }

            if (timer.timeSpend.seconds === InvityAPIReloadQuotesAfterSeconds) {
                callback();
            }
        }
    };

    useServerEnvironment();

    return {
        callInProgress,
        account,
        selectedQuote,
        timer,
        device,
        setCallInProgress,
        setSelectedQuote,
        checkQuotesTimer,
    };
};
