import { useState } from 'react';
import { createPortal } from 'react-dom';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { Button, Modal } from '@trezor/components';
import { resolveStaticPath } from '@trezor/env-utils';
import { borders, zIndices } from '@trezor/theme';

const ThumbnailImage = styled.img`
    max-width: 100%;
    cursor: zoom-in;
    border: solid 2px ${({ theme }) => theme.elementBorderField};
    border-radius: ${borders.radii.xxs};
    transition: all 0.2s ease;
    padding: 4px;

    &:hover {
        border-color: ${({ theme }) => theme.elementBorderFieldHovered};
    }
`;

const FullSizeImage = styled.img`
    max-width: 100%;
    max-height: 100%;
    border-radius: ${borders.radii.xxs};
    cursor: zoom-out;
`;

const CloseButtonWrapper = styled.div`
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: ${zIndices.modal};
`;

type GuideImageProps = {
    src?: string;
    alt?: string;
};

export const GuideImage = ({ src, alt }: GuideImageProps) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!src) return null;

    // The transformer emits internal asset paths as `/guide/assets/...`.
    // Resolve them at runtime so each build target (web / desktop file://)
    // gets the correct ASSET_PREFIX baked into its renderer bundle.
    const resolvedSrc = src.startsWith('/guide/') ? resolveStaticPath(src) : src;

    const close = () => setIsOpen(false);

    return (
        <>
            <ThumbnailImage src={resolvedSrc} alt={alt} onClick={() => setIsOpen(true)} />
            {isOpen &&
                createPortal(
                    <Modal.Backdrop onClick={close} zIndex={zIndices.guide}>
                        <FullSizeImage src={resolvedSrc} alt={alt} onClick={close} />
                        <CloseButtonWrapper>
                            <Button
                                iconLeft="x"
                                intent="neutral"
                                priority="secondary"
                                onClick={close}
                            >
                                <Translation id="TR_CLOSE" />
                            </Button>
                        </CloseButtonWrapper>
                    </Modal.Backdrop>,
                    document.body,
                )}
        </>
    );
};
