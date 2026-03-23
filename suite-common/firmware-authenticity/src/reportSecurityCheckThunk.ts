import { createThunk } from '@suite-common/redux-utils';
import { type ReportSecurityCheckParams } from '@suite-common/suite-types';

export const FIRMWARE_AUTHENTICITY_MODULE_PREFIX = '@common/firmware-authenticity';

/**
 * Wrapper thunk around extra.services.reportSecurityCheck
 */
export const reportSecurityCheckThunk = createThunk<void, ReportSecurityCheckParams, void>(
    `${FIRMWARE_AUTHENTICITY_MODULE_PREFIX}/reportSecurityCheckThunk`,
    (props, { extra }) => {
        extra.services.reportSecurityCheck(props);
    },
);
