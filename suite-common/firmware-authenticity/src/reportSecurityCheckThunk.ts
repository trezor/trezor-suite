import {
    type ReportSecurityCheckDep,
    type ReportSecurityCheckParams,
} from '@suite-common/suite-types';
import { type WithServices, createThunk } from '@trezor/redux-utils';

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
