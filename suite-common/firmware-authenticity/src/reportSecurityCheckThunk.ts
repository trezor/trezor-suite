import { createThunk } from '@suite-common/redux-utils';
import { ReportSecurityCheckProps } from '@suite-common/suite-types';

export const FIRMWARE_AUTHENTICITY_MODULE_PREFIX = '@common/firmware-authenticity';

/**
 * Wrapper thunk around extra.utils.reportSecurityCheck
 */
export const reportSecurityCheckThunk = createThunk<void, ReportSecurityCheckProps, void>(
    `${FIRMWARE_AUTHENTICITY_MODULE_PREFIX}/reportSecurityCheckThunk`,
    (props, { extra }) => {
        extra.utils.reportSecurityCheck(props);
    },
);
