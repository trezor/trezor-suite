import { useEffect, useRef, useState } from 'react';

import styled from 'styled-components';

import { type DappCatalogEntry } from '@suite/dapp-browser';
import { selectHasActiveModal } from '@suite/modal';
import { type Account } from '@suite-common/wallet-types';
import { desktopApi } from '@trezor/suite-desktop-api';

import { useSelector } from 'src/hooks/suite';

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

    // The native view ignores DOM z-index and paints over the Suite renderer, so
    // any on-top Suite overlay — the account menu here, a WalletConnect (or any
    // Redux) modal — would otherwise be drawn behind it. Hide the native view
    // while one is open.
    const hasActiveModal = useSelector(selectHasActiveModal);
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
    const shouldHideView = hasActiveModal || isAccountMenuOpen;

    // Only push on an actual change. The first reveal is owned by the bounds
    // report (avoids a full-window flash), so don't emit the initial `visible:
    // true`; do emit if an overlay is somehow already up on mount.
    const prevShouldHideRef = useRef<boolean | null>(null);
    useEffect(() => {
        if (prevShouldHideRef.current === shouldHideView) {
            return;
        }

        const isInitial = prevShouldHideRef.current === null;
        prevShouldHideRef.current = shouldHideView;

        if (isInitial && !shouldHideView) {
            return;
        }

        desktopApi.dappBrowserSetVisible({ visible: !shouldHideView });
    }, [shouldHideView]);

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
        // Layout can shift on scroll inside the page chrome.
        // TODO: use requestAnimationFrame to avoid flooding the main process with events, throttling or ideally observer
        window.addEventListener('scroll', reportBounds, true);

        return () => {
            resizeObserver.disconnect();
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
                isAccountMenuOpen={isAccountMenuOpen}
                onAccountMenuOpenChange={setIsAccountMenuOpen}
                onClose={onClose}
            />
            <ViewSlot ref={slotRef} />
        </Wrapper>
    );
};
