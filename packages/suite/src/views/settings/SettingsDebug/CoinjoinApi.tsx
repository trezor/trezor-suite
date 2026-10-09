import styled from 'styled-components';

import {
    type CoinjoinClientInstance,
    isCoinjoinSupportedSymbol,
    selectCoinjoinClients,
} from '@suite/coinjoin';
import { BITCOIN_ONLY_SYMBOLS } from '@suite-common/suite-constants';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { Button } from '@trezor/components';
import { SectionItem } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';

const CoordinatorVersionContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
`;

type CoordinatorServerProps = {
    symbol: NetworkSymbol;
    version?: CoinjoinClientInstance['version'];
};

type CoordinatorVersionProps = { version: CoordinatorServerProps['version'] };

const CoordinatorVersion = ({ version }: CoordinatorVersionProps) => {
    if (!version) return null;

    return (
        <CoordinatorVersionContainer>
            Build{' '}
            <Button
                intent="neutral"
                priority="secondary"
                href={`https://github.com/zkSNACKs/WalletWasabi/commit/${version.commitHash}`}
                margin={{ left: 4 }}
            >
                {version.commitHash}
            </Button>
        </CoordinatorVersionContainer>
    );
};

// The coordinator itself is not selectable here, every network has a single environment. Testers
// set a coordinator through debug.coinjoinConfigOverride, see docs/features/coinjoin.md.
const CoordinatorServer = ({ symbol, version }: CoordinatorServerProps) => {
    const networkName = getNetwork(symbol).name;

    if (!isCoinjoinSupportedSymbol(symbol)) return null;

    return (
        <SectionItem
            data-testid={`@settings/debug/coinjoin/${symbol}`}
            title={`${networkName}`}
            description={
                <>
                    {networkName} coordinator server configuration
                    <CoordinatorVersion version={version} />
                </>
            }
        />
    );
};

export const CoinjoinApi = () => {
    const clients = useSelector(selectCoinjoinClients);

    const coinjoinSymbols = BITCOIN_ONLY_SYMBOLS.filter(symbol =>
        isCoinjoinSupportedSymbol(symbol),
    );

    return (
        <>
            {coinjoinSymbols.map(symbol => (
                <CoordinatorServer
                    key={symbol}
                    symbol={symbol}
                    version={clients[symbol]?.version}
                />
            ))}
        </>
    );
};
