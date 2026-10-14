import { useState } from 'react';

import { exportMetadataToLocalFileThunk } from '@suite/metadata';
import { useServices } from '@trezor/dependency-injection';
import { SectionItem } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

export const Metadata = () => {
    const { dispatch } = useServices(injectDispatch);
    const [exporting, setExporting] = useState(false);

    const onClick = () => {
        setExporting(true);
        dispatch(exportMetadataToLocalFileThunk()).finally(() => {
            setExporting(false);
        });
    };

    return (
        <SectionItem
            data-testid="@settings/debug/metadata"
            title="Export"
            description="Export labeling files to your computer. You may use this to transfer your labeling files from your Google drive account to your Dropbox account."
            actions={
                <SectionItem.Button onClick={onClick} isDisabled={exporting} isLoading={exporting}>
                    Export
                </SectionItem.Button>
            }
        />
    );
};
