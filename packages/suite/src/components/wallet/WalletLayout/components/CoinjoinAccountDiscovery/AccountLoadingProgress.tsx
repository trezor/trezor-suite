import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Progress } from '@trezor/components';
import { CoinjoinService } from 'src/services/coinjoin';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { useSelector } from 'src/hooks/suite/useSelector';
import { getAccountProgressHandle } from 'src/utils/wallet/coinjoinUtils';

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

        const onProgress = ({ info }: { info?: ProgressInfo }) => info && setProgress(info);

        api.backend.on(`progress/${progressHandle}`, onProgress);

        return () => {
            api.backend.off(`progress/${progressHandle}`, onProgress);
        };
    }, [network, backendType, progressHandle]);

    const value = progress.progress ?? 0;

    return <DiscoveryProgress max={1} value={value} />;
};
