import { useEffect, useRef } from 'react';

import styled from 'styled-components';

import { type DappCatalogEntry } from '@suite/dapp-browser';
import { Translation } from '@suite/intl';
import { Button } from '@trezor/components';
import { desktopApi } from '@trezor/suite-desktop-api';
import { spacingsPx } from '@trezor/theme';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
`;

const Toolbar = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${spacingsPx.sm};
    padding: ${spacingsPx.sm} ${spacingsPx.md};
`;

const Title = styled.span`
    font-weight: 600;
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
    onClose: () => void;
};

export const DappViewport = ({ entry, onClose }: DappViewportProps) => {
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
            <Toolbar>
                <Title>{entry.name}</Title>
                <Button size="small" intent="neutral" priority="secondary" onClick={onClose}>
                    <Translation id="TR_DAPP_BROWSER_CLOSE" />
                </Button>
            </Toolbar>
            <ViewSlot ref={slotRef} />
        </Wrapper>
    );
};
