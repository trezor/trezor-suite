import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Progress } from '@trezor/components';
import { CoinjoinBackendService } from '@suite/services/coinjoin/coinjoinBackend';
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

        const backend = CoinjoinBackendService.getInstance(network);

        if (!backend) {
            return;
        }

        const onProgress = ({ info }: { info?: ProgressInfo }) => info && setProgress(info);

        backend.on(`progress/${descriptor}`, onProgress);

        return () => {
            backend.off(`progress/${descriptor}`, onProgress);
        };
    }, [network, backendType, descriptor]);

    const value = progress.progress ?? 0;

    return <DiscoveryProgress max={1} value={value} />;
};
