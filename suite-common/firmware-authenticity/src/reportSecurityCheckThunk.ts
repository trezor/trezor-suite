import { type WithServices, createThunk } from '@suite-common/redux-utils';
import {
    type ReportSecurityCheckDep,
    type ReportSecurityCheckParams,
} from '@suite-common/suite-types';

const FIRMWARE_AUTHENTICITY_MODULE_PREFIX = '@common/firmware-authenticity';

/**
 * Wrapper thunk around extra.services.reportSecurityCheck
 */
type ReportSecurityCheckThunkDeps = WithServices<ReportSecurityCheckDep>;

export const reportSecurityCheckThunk = createThunk<
    void,
    ReportSecurityCheckParams,
    { extra: ReportSecurityCheckThunkDeps }
>(`${FIRMWARE_AUTHENTICITY_MODULE_PREFIX}/reportSecurityCheckThunk`, (props, { extra }) => {
    extra.services.reportSecurityCheck(props);
});
