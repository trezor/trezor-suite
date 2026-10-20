import { Translation } from '@suite/intl';
import { getNetwork } from '@suite-common/wallet-config';
import { type NetworkBackend, selectConnectingBackends, useSelector } from '@trezor/suite';

const formatBackend = ({ symbol, customUrls }: NetworkBackend) => {
    const { name } = getNetwork(symbol);

    return customUrls.length > 0 ? `${name} (${customUrls.join(', ')})` : name;
};

export const SlowLoadingMessage = () => {
    const connectingBackends = useSelector(selectConnectingBackends);

    return (
        <>
            <Translation id="TR_LOADING_TAKES_LONGER_THAN_EXPECTED" />
            {connectingBackends.length > 0 && (
                <>
                    <br />
                    <Translation
                        id="TR_LOADING_WAITING_FOR_BACKENDS"
                        values={{ backends: connectingBackends.map(formatBackend).join(', ') }}
                    />
                </>
            )}
        </>
    );
};
