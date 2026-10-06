import { asGetter } from '@suite-common/dependency-injection';

import {
    type GetAllowPrerelease,
    type GetBinFilesBaseUrl,
    type ReportSecurityCheck,
    type RerunFwAuthenticityChecksCall,
    type ShouldRetryFirmwareRevisionCheckError,
} from '../src/firmware';
import { type GetLanguageDep } from '../src/languages';

export const mockGetAllowPrerelease = (): GetAllowPrerelease => asGetter(() => false);
export const mockGetBinFilesBaseUrl = (): GetBinFilesBaseUrl => asGetter(() => '/bin');
export const mockGetLanguage = (): GetLanguageDep['getLanguage'] => asGetter(() => 'en');
export const mockReportSecurityCheck = (): ReportSecurityCheck => () => {};
export const mockShouldRetryFirmwareRevisionCheckError =
    (): ShouldRetryFirmwareRevisionCheckError => asGetter(() => false);
export const mockRerunFwAuthenticityChecksCall = (): RerunFwAuthenticityChecksCall => () => {};
