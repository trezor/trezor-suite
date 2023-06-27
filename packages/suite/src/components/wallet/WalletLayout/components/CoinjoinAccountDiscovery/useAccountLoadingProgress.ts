import { useEffect, useState } from 'react';
import { CoinjoinService } from 'src/services/coinjoin';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { useSelector } from 'src/hooks/suite/useSelector';
import { getAccountProgressHandle } from 'src/utils/wallet/coinjoinUtils';

type ProgressInfo = {
    progress?: number;
    message?: string;
};

export const useAccountLoadingProgress = () => {
    const selectedAccount = useSelector(selectSelectedAccount);
    const [progress, setProgress] = useState<number>();
    const [message, setMessage] = useState<string>();

    const { symbol: network, backendType } = selectedAccount || {};
    const progressHandle = selectedAccount && getAccountProgressHandle(selectedAccount);

    useEffect(() => {
        if (!network || backendType !== 'coinjoin') {
            return;
        }

        const api = CoinjoinService.getInstance(network);

        if (!api) {
            return;
        }

        const onProgressInfo = (info: ProgressInfo) => {
            if (info.progress) setProgress(info.progress);
            if (info.message) setMessage(info.message);
        };

        api.backend.on(`progress-info/${progressHandle}`, onProgressInfo);

        return () => {
            api.backend.off(`progress-info/${progressHandle}`, onProgressInfo);
        };
    }, [network, backendType, progressHandle]);

    const value = progress ?? 0;

    return { value, message };
};
