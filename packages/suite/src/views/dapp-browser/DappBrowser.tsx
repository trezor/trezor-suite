import { useCallback, useEffect, useState } from 'react';

import styled from 'styled-components';

import { DAPP_CATALOG } from '@suite/dapp-browser';
import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { Paragraph } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
import { desktopApi } from '@trezor/suite-desktop-api';
import { spacingsPx } from '@trezor/theme';

import { useDispatch } from 'src/hooks/suite';

import { ConsentInterstitial } from './ConsentInterstitial';
import { DappViewport } from './DappViewport';

const Centered = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: ${spacingsPx.xl};
`;

type Stage = 'consent' | 'open';

export const DappBrowser = () => {
    const dispatch = useDispatch();

    const [stage, setStage] = useState<Stage>('consent');
    const [isOpening, setIsOpening] = useState(false);

    // M1 opens a single hard-coded catalog dApp; the full catalog grid is M6.
    const entry = DAPP_CATALOG[0];

    // Always tear the native view down when leaving the page.
    useEffect(() => () => void desktopApi.dappBrowserClose(), []);

    const handleContinue = useCallback(async () => {
        if (!entry) {
            return;
        }

        setIsOpening(true);
        const result = await desktopApi.dappBrowserOpen({ entryId: entry.id });
        setIsOpening(false);

        if (result.success) {
            setStage('open');
        }
    }, [entry]);

    const handleCancel = useCallback(() => {
        dispatch(goto({ routeName: 'suite-index' }));
    }, [dispatch]);

    const handleClose = useCallback(async () => {
        await desktopApi.dappBrowserClose();
        setStage('consent');
    }, []);

    if (!isDesktop()) {
        return (
            <Centered>
                <Paragraph intent="warning">
                    <Translation id="TR_DAPP_BROWSER_DESKTOP_ONLY" />
                </Paragraph>
            </Centered>
        );
    }

    if (!entry) {
        return null;
    }

    if (stage === 'open') {
        return <DappViewport entry={entry} onClose={handleClose} />;
    }

    return (
        <ConsentInterstitial
            entry={entry}
            isLoading={isOpening}
            onContinue={handleContinue}
            onCancel={handleCancel}
        />
    );
};
