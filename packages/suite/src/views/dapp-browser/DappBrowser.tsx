import { useCallback, useEffect, useState } from 'react';

import styled from 'styled-components';

import { type DappCatalogEntry } from '@suite/dapp-browser';
import { Translation } from '@suite/intl';
import { Paragraph } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
import { desktopApi } from '@trezor/suite-desktop-api';
import { spacingsPx } from '@trezor/theme';

import { CatalogGrid } from './CatalogGrid';
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
    onExit: () => void;
};

const DappBrowserSession = ({ entry, onExit }: DappBrowserSessionProps) => {
    const { accounts, selectedAddress, connect, selectAccount } = useDappConnection(entry);

    useDappRequestHandler();

    const [stage, setStage] = useState<Stage>('consent');
    const [isOpening, setIsOpening] = useState(false);

    // Always tear the native view down when the session unmounts.
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

    if (stage === 'open') {
        return (
            <DappViewport
                entry={entry}
                accounts={accounts}
                selectedAddress={selectedAddress}
                onSelectAccount={selectAccount}
                onClose={onExit}
            />
        );
    }

    return (
        <ConsentInterstitial
            entry={entry}
            isLoading={isOpening}
            onContinue={handleContinue}
            onCancel={onExit}
        />
    );
};

export const DappBrowser = () => {
    const [selectedEntry, setSelectedEntry] = useState<DappCatalogEntry | undefined>();

    if (!isDesktop()) {
        return (
            <Centered>
                <Paragraph intent="warning">
                    <Translation id="TR_DAPP_BROWSER_DESKTOP_ONLY" />
                </Paragraph>
            </Centered>
        );
    }

    if (!selectedEntry) {
        return <CatalogGrid onSelect={setSelectedEntry} />;
    }

    return <DappBrowserSession entry={selectedEntry} onExit={() => setSelectedEntry(undefined)} />;
};
