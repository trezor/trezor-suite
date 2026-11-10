import { useContext } from 'react';

import { LayoutPayloadContext } from '../../../../support/suite/LayoutContext';
import { Metadata } from '../../Metadata';

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
