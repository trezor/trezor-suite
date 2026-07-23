import { type DataType } from '@suite-common/metadata-types';
import { typedObjectKeys } from '@trezor/utils';

import { type FetchIntervalTrackingId } from './metadataUtils';

export const fetchIntervals: { [id: FetchIntervalTrackingId]: ReturnType<typeof setInterval> } = {};

type ClearFetchIntervalsParams = {
    dataType: DataType;
    clientId?: string;
};

export const clearFetchIntervals = ({ dataType, clientId }: ClearFetchIntervalsParams) => {
    const trackingIdPrefix = clientId ? `${dataType}-${clientId}-` : `${dataType}-`;

    typedObjectKeys(fetchIntervals).forEach(trackingId => {
        if (trackingId.startsWith(trackingIdPrefix)) {
            clearInterval(fetchIntervals[trackingId]);
            delete fetchIntervals[trackingId];
        }
    });
};
