import { useSelector } from '@suite-hooks/useSelector';
import { versionUtils } from '@trezor/utils';

export const useActionAbortable = () => {
    const transport = useSelector(state => state.suite.transport);

    return transport?.type === 'BridgeTransport'
        ? versionUtils.isNewerOrEqual(transport?.version as string, '2.0.31')
        : true; // WebUSB
};
