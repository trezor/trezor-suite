import type { MetadataAction } from '../metadataActions';
import * as METADATA from '../metadataConstants';

export const setEditing = (payload: string | undefined): MetadataAction => ({
    type: METADATA.SET_EDITING,
    payload,
});
