import { useContext } from 'react';

import { Metadata } from 'src/components/suite/Metadata';
import { LayoutPayloadContext } from 'src/support/suite/LayoutContext';

export const LayoutMetadata = () => {
    const { title } = useContext(LayoutPayloadContext);

    return <Metadata title={title} />;
};

export const LayoutHeaderSlot = () => {
    const { layoutHeader } = useContext(LayoutPayloadContext);

    return layoutHeader;
};

export const LayoutFooterSlot = () => {
    const { layoutFooter } = useContext(LayoutPayloadContext);

    return layoutFooter;
};
