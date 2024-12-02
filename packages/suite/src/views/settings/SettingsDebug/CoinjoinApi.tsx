import styled from 'styled-components';

import { NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { Button } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { BITCOIN_ONLY_SYMBOLS } from '@suite-common/suite-constants';

import { ActionColumn, ActionSelect, SectionItem, TextColumn } from 'src/components/suite';
import { COINJOIN_NETWORKS, CoinjoinSymbol } from 'src/services/coinjoin';
import { setDebugSettings } from 'src/actions/wallet/coinjoinClientActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { CoinjoinServerEnvironment, CoinjoinClientInstance } from 'src/types/wallet/coinjoin';
import { reloadApp } from 'src/utils/suite/reload';
import { isCoinjoinSupportedSymbol } from 'src/utils/wallet/coinjoinUtils';

const StyledActionSelect = styled(ActionSelect)`
    min-width: 256px;
`;

const CoordinatorVersionContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
`;

type CoordinatorServerProps = {
    symbol: NetworkSymbol;
    version?: CoinjoinClientInstance['version'];
    environments: CoinjoinServerEnvironment[];
    value?: CoinjoinServerEnvironment;
    onChange: (symbol: CoinjoinSymbol, value: CoinjoinServerEnvironment) => void;
};

type CoordinatorVersionProps = { version: CoordinatorServerProps['version'] };

const CoordinatorVersion = ({ version }: CoordinatorVersionProps) => {
    if (!version) return null;

    return (
        <CoordinatorVersionContainer>
            Build{' '}
            <Button
                variant="tertiary"
                icon="arrowUpRight"
                iconAlignment="right"
                href={`https://github.com/zkSNACKs/WalletWasabi/commit/${version.commitHash}`}
                margin={{ left: spacings.xxs }}
            >
                {version.commitHash}
            </Button>
        </CoordinatorVersionContainer>
    );
};

const CoordinatorServer = ({
    symbol,
    version,
    environments,
    value,
    onChange,
}: CoordinatorServerProps) => {
    const options = environments.map(environment => ({
        label: environment,
        value: environment,
    }));

    const selectedOption = (value && options.find(option => option.value === value)) ?? options[0];
    const networkName = getNetwork(symbol).name;

    if (!isCoinjoinSupportedSymbol(symbol)) return null;

    return (
        <SectionItem data-testid={`@settings/debug/coinjoin/${symbol}`}>
            <TextColumn
                title={`${networkName}`}
                description={
                    <>
                        {networkName} coordinator server configuration
                        <CoordinatorVersion version={version} />
                    </>
                }
            />
            <ActionColumn>
                <StyledActionSelect
                    isDisabled={options.length < 2}
                    onChange={({ value }) => onChange(symbol, value)}
                    value={selectedOption}
                    options={options}
                    data-testid={`@settings/debug/coinjoin/${symbol}/server-select`}
                />
            </ActionColumn>
        </SectionItem>
    );
};

export const CoinjoinApi = () => {
    const debug = useSelector(state => state.wallet.coinjoin.debug);
    const clients = useSelector(state => state.wallet.coinjoin.clients);
    const dispatch = useDispatch();

    const coinjoinSymbols = BITCOIN_ONLY_SYMBOLS.filter(symbol =>
        isCoinjoinSupportedSymbol(symbol),
    );

    const handleServerChange: CoordinatorServerProps['onChange'] = (symbol, value) => {
        dispatch(
            setDebugSettings({
                coinjoinServerEnvironment: {
                    [symbol]: value,
                },
            }),
        );
        // reload the Suite to reinitialize everything, with a slight delay to let the browser save the settings
        reloadApp(100);
    };

    return (
        <>
            {coinjoinSymbols.map(symbol => {
                const environments = Object.keys(
                    COINJOIN_NETWORKS[symbol] || {},
                ) as CoinjoinServerEnvironment[];

                return (
                    <CoordinatorServer
                        key={symbol}
                        symbol={symbol}
                        version={clients[symbol]?.version}
                        environments={environments}
                        value={
                            debug?.coinjoinServerEnvironment &&
                            debug?.coinjoinServerEnvironment[symbol]
                        }
                        onChange={handleServerChange}
                    />
                );
            })}
        </>
    );
};
