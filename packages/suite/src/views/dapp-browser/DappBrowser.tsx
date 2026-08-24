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
    const { accounts, selectedAddress, chainId, selectAccount } = useDappConnection(entry);

    useDappRequestHandler();

    const [stage, setStage] = useState<Stage>('consent');
    const [isOpening, setIsOpening] = useState(false);

    // Always tear the native view down when the session unmounts.
    useEffect(() => () => void desktopApi.dappBrowserClose(), []);

    const handleContinue = useCallback(async () => {
        setIsOpening(true);
        // Auto-connect (§4): the grant travels with `open` so it is set before the
        // page loads and the provider's first eth_accounts already resolves.
        const result = await desktopApi.dappBrowserOpen({
            entryId: entry.id,
            grant: selectedAddress ? { address: selectedAddress, chainId } : undefined,
        });
        setIsOpening(false);

        if (result.success) {
            setStage('open');
        }
    }, [entry.id, selectedAddress, chainId]);

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
            hasAccount={!!selectedAddress}
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
