import { useEffect, useRef } from 'react';

import styled from 'styled-components';

import { type DappCatalogEntry } from '@suite/dapp-browser';
import { type Account } from '@suite-common/wallet-types';
import { desktopApi } from '@trezor/suite-desktop-api';

import { DappTopBar } from './DappTopBar';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
`;

// The native WebContentsView is painted on top of the window content (it ignores
// DOM z-index), so this placeholder owns no pixels — it only measures where the
// view should be drawn and reports the rect to the main process.
const ViewSlot = styled.div`
    flex: 1;
    min-height: 0;
`;

type DappViewportProps = {
    entry: DappCatalogEntry;
    accounts: Account[];
    selectedAddress: string | undefined;
    onSelectAccount: (address: string) => void;
    onClose: () => void;
};

export const DappViewport = ({
    entry,
    accounts,
    selectedAddress,
    onSelectAccount,
    onClose,
}: DappViewportProps) => {
    const slotRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const slot = slotRef.current;

        if (!slot) {
            return;
        }

        const reportBounds = () => {
            const rect = slot.getBoundingClientRect();
            desktopApi.dappBrowserSetBounds({
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
            });
        };

        reportBounds();

        const resizeObserver = new ResizeObserver(reportBounds);
        resizeObserver.observe(slot);
        window.addEventListener('resize', reportBounds);
        // Layout can shift on scroll inside the page chrome.
        window.addEventListener('scroll', reportBounds, true);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', reportBounds);
            window.removeEventListener('scroll', reportBounds, true);
        };
    }, []);

    return (
        <Wrapper>
            <DappTopBar
                entry={entry}
                accounts={accounts}
                selectedAddress={selectedAddress}
                onSelectAccount={onSelectAccount}
                onClose={onClose}
            />
            <ViewSlot ref={slotRef} />
        </Wrapper>
    );
};
