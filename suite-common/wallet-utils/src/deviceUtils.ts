import { type TrezorDevice } from '@suite-common/suite-types';

// local copy of import { isApprovalFlowSupported } from '@suite-common/device'; > reviewTransactionUtils
export const isApprovalFlowSupported = (device: TrezorDevice | undefined) =>
    !device?.unavailableCapabilities?.['evmApproval'];

// local copy of import { isEvmClearSigningSupported } from '@suite-common/device'; > reviewTransactionUtils
export const isEvmClearSigningSupported = (device: TrezorDevice | undefined) =>
    !device?.unavailableCapabilities?.['evmClearSigning'];
