import { useState } from 'react';
import { createPortal } from 'react-dom';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { Button, Modal } from '@trezor/components';
import { zIndices } from '@trezor/theme';

const ThumbnailImage = styled.img`
    max-width: 100%;
    cursor: zoom-in;
`;

const FullSizeImage = styled.img`
    max-width: 100%;
    max-height: 100%;
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

    const close = () => setIsOpen(false);

    return (
        <>
            <ThumbnailImage src={src} alt={alt} onClick={() => setIsOpen(true)} />
            {isOpen &&
                createPortal(
                    <Modal.Backdrop onClick={close}>
                        <FullSizeImage src={src} alt={alt} onClick={close} />
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
