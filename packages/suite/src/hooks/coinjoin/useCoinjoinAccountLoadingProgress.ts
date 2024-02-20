import { useEffect, useReducer } from 'react';
import { ScanProgressInfo } from '@trezor/coinjoin';

import { CoinjoinService } from 'src/services/coinjoin';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { useSelector } from 'src/hooks/suite/useSelector';
import { getAccountProgressHandle } from 'src/utils/wallet/coinjoinUtils';
import { TranslationKey } from 'src/components/suite/Translation';

const INIT_THRESHOLD = 0.05;
const MEMPOOL_THRESHOLD = 0.85;

type ProgressInfoReducerState = {
    messageId?: TranslationKey;
    progress: number;
    stage?: 'block' | 'mempool';
    outOf?: { current: number; total: number };
};

const progressInfoReducer = (
    state: ProgressInfoReducerState,
    info: ScanProgressInfo,
): ProgressInfoReducerState => {
    if (info.progress) {
        // block stage with progress, simply calculate
        if (info.stage === 'block') {
            const current = info.progress.current - info.progress.from;
            const total = info.progress.to - info.progress.from;

            return {
                stage: 'block',
                outOf: { current, total },
                progress: INIT_THRESHOLD + (current / total) * (MEMPOOL_THRESHOLD - INIT_THRESHOLD),
                messageId: 'TR_COINJOIN_DISCOVERY_BLOCK_PROGRESS',
            };
        }
        // mempool stage with progress, simply calculate, but only for 0th iteration
        if (!info.progress.iteration) {
            const { current, total } = info.progress;

            return {
                stage: 'mempool',
                outOf: { current, total },
                progress: MEMPOOL_THRESHOLD + (current / total) * (1 - MEMPOOL_THRESHOLD),
                messageId: 'TR_COINJOIN_DISCOVERY_MEMPOOL_PROGRESS',
            };
        }
    } else if (info.stage !== state.stage) {
        // block stage without progress, previous stage was undefined
        if (info.stage === 'block') {
            return {
                stage: 'block',
                progress: INIT_THRESHOLD,
                messageId: 'TR_COINJOIN_DISCOVERY_BLOCK_FETCHING',
            };
        }

        // mempool stage without progress, previous stage was block
        return {
            stage: 'mempool',
            progress: MEMPOOL_THRESHOLD,
            messageId: 'TR_COINJOIN_DISCOVERY_MEMPOOL_FETCHING',
        };
    }

    // following iterations of mempool stage OR unchanged stage without progress, leave as it is
    return state;
};

export const useCoinjoinAccountLoadingProgress = () => {
    const selectedAccount = useSelector(selectSelectedAccount);
    const [progressInfo, dispatchProgressInfo] = useReducer(progressInfoReducer, {
        progress: 0,
    });

    const { symbol: network, backendType } = selectedAccount || {};
    const progressHandle = selectedAccount && getAccountProgressHandle(selectedAccount);

    useEffect(() => {
        if (!network || !progressHandle || backendType !== 'coinjoin') {
            return;
        }

        const api = CoinjoinService.getInstance(network);

        if (!api) {
            return;
        }

        api.backend.on(`progress-info/${progressHandle}`, dispatchProgressInfo);

        return () => {
            api.backend.off(`progress-info/${progressHandle}`, dispatchProgressInfo);
        };
    }, [network, backendType, progressHandle]);

    return progressInfo;
};
