import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Progress } from '@trezor/components';
import { CoinjoinService } from '@suite/services/coinjoin';
import { selectSelectedAccount } from '@wallet-reducers/selectedAccountReducer';
import { useSelector } from '@suite-hooks/useSelector';

const DiscoveryProgress = styled(Progress)`
    max-width: 440px;
    margin: 24px 0 28px;
`;

type ProgressInfo = {
    progress?: number;
    message?: string;
};

export const AccountLoadingProgress = () => {
    const selectedAccount = useSelector(selectSelectedAccount);
    const [progress, setProgress] = useState<ProgressInfo>({});

    const { symbol: network, backendType, descriptor } = selectedAccount || {};

    useEffect(() => {
        if (!network || backendType !== 'coinjoin') {
            return;
        }

        const api = CoinjoinService.getInstance(network);

        if (!api) {
            return;
        }

        const onProgress = ({ info }: { info?: ProgressInfo }) => info && setProgress(info);

        api.backend.on(`progress/${descriptor}`, onProgress);

        return () => {
            api.backend.off(`progress/${descriptor}`, onProgress);
        };
    }, [network, backendType, descriptor]);

    const value = progress.progress ?? 0;

    return <DiscoveryProgress max={1} value={value} />;
};
