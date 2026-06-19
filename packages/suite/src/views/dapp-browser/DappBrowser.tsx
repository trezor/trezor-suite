import { useCallback, useEffect, useState } from 'react';

import styled from 'styled-components';

import { DAPP_CATALOG, type DappCatalogEntry } from '@suite/dapp-browser';
import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { Paragraph } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
import { desktopApi } from '@trezor/suite-desktop-api';
import { spacingsPx } from '@trezor/theme';

import { useDispatch } from 'src/hooks/suite';

import { ConsentInterstitial } from './ConsentInterstitial';
import { DappViewport } from './DappViewport';
import { useDappConnection } from './useDappConnection';
import { useDappRequestHandler } from './useDappRequestHandler';

const Centered = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: ${spacingsPx.xl};
`;

type Stage = 'consent' | 'open';

type DappBrowserSessionProps = {
    entry: DappCatalogEntry;
};

const DappBrowserSession = ({ entry }: DappBrowserSessionProps) => {
    const dispatch = useDispatch();
    const { accounts, selectedAddress, connect, selectAccount } = useDappConnection(entry);

    useDappRequestHandler();

    const [stage, setStage] = useState<Stage>('consent');
    const [isOpening, setIsOpening] = useState(false);

    // Always tear the native view down when leaving the page.
    useEffect(() => () => void desktopApi.dappBrowserClose(), []);

    const handleContinue = useCallback(async () => {
        setIsOpening(true);
        const result = await desktopApi.dappBrowserOpen({ entryId: entry.id });
        setIsOpening(false);

        if (result.success) {
            // Auto-connect: push the grant before the page's provider asks (§4).
            connect();
            setStage('open');
        }
    }, [entry.id, connect]);

    const handleCancel = useCallback(() => {
        dispatch(goto({ routeName: 'suite-index' }));
    }, [dispatch]);

    const handleClose = useCallback(async () => {
        await desktopApi.dappBrowserClose();
        setStage('consent');
    }, []);

    if (stage === 'open') {
        return (
            <DappViewport
                entry={entry}
                accounts={accounts}
                selectedAddress={selectedAddress}
                onSelectAccount={selectAccount}
                onClose={handleClose}
            />
        );
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

export const DappBrowser = () => {
    // M1/M2 open a single hard-coded catalog dApp; the full catalog grid is M6.
    const entry = DAPP_CATALOG[0];

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

    return <DappBrowserSession entry={entry} />;
};
