import { Translation } from '@suite/intl';
import { getNetwork } from '@suite-common/wallet-config';

import { useSelector } from 'src/hooks/suite';
import {
    type NetworkBackend,
    selectConnectingBackends,
} from 'src/selectors/suite/backendSelectors';

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
