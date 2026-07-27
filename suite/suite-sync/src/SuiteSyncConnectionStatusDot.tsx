import { DotIndicator } from '@trezor/components';

type SuiteSyncConnectionStatusDotProps = {
    isConnected: boolean;
};

export const SuiteSyncConnectionStatusDot = ({
    isConnected,
}: SuiteSyncConnectionStatusDotProps) => <DotIndicator isActive={isConnected} />;
