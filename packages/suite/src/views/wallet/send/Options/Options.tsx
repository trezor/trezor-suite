import { useSendFormContext } from 'src/hooks/wallet';

import { BitcoinOptions } from './BitcoinOptions/BitcoinOptions';
import { CardanoOptions } from './CardanoOptions';
import { EthereumOptions } from './EthereumOptions/EthereumOptions';
import { MiscNetworkOptions } from './MiscNetworkOptions/MiscNetworkOptions';

export const Options = () => {
    const {
        account: { networkType },
    } = useSendFormContext();

    return (
        <>
            {networkType === 'bitcoin' && <BitcoinOptions />}
            {networkType === 'ethereum' && <EthereumOptions />}
            {(networkType === 'ripple' || networkType === 'stellar') && <MiscNetworkOptions />}
            {networkType === 'cardano' && <CardanoOptions />}
        </>
    );
};
