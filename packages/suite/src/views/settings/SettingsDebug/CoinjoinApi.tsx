import styled from 'styled-components';

import { NetworkSymbol, networks } from '@suite-common/wallet-config';
import { Switch, Button, Link } from '@trezor/components';

import { ActionColumn, ActionSelect, SectionItem, TextColumn } from 'src/components/suite';
import { COINJOIN_NETWORKS } from 'src/services/coinjoin';
import { setDebugSettings } from 'src/actions/wallet/coinjoinClientActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { CoinjoinServerEnvironment, CoinjoinClientInstance } from 'src/types/wallet/coinjoin';
import { reloadApp } from 'src/utils/suite/reload';

const StyledActionSelect = styled(ActionSelect)`
    min-width: 256px;
`;

const StyledButton = styled(Button)`
    margin-left: 8px;
`;

const CoordinatorVersionContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
`;

interface CoordinatorServerProps {
    symbol: NetworkSymbol;
    version?: CoinjoinClientInstance['version'];
    environments: CoinjoinServerEnvironment[];
    value?: CoinjoinServerEnvironment;
    onChange: (network: NetworkSymbol, value: CoinjoinServerEnvironment) => void;
}

const CoordinatorVersion = ({ version }: { version: CoordinatorServerProps['version'] }) => {
    if (!version) return null;

    return (
        <CoordinatorVersionContainer>
            Build{' '}
            <Link href={`https://github.com/zkSNACKs/WalletWasabi/commit/${version.commitHash}`}>
                <StyledButton variant="tertiary" icon="EXTERNAL_LINK" iconAlignment="right">
                    {version.commitHash}
                </StyledButton>
            </Link>
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
    const networkName = networks[symbol].name;

    return (
        <SectionItem data-test={`@settings/debug/coinjoin/${symbol}`}>
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
                    data-test={`@settings/debug/coinjoin/${symbol}/server-select`}
                />
            </ActionColumn>
        </SectionItem>
    );
};

export const CoinjoinApi = () => {
    const debug = useSelector(state => state.wallet.coinjoin.debug);
    const clients = useSelector(state => state.wallet.coinjoin.clients);
    const dispatch = useDispatch();

    const handleServerChange: CoordinatorServerProps['onChange'] = (network, value) => {
        dispatch(
            setDebugSettings({
                coinjoinServerEnvironment: {
                    [network]: value,
                },
            }),
        );
        // reload the Suite to reinitialize everything, with a slight delay to let the browser save the settings
        reloadApp(100);
    };

    const handleTorChange = () =>
        dispatch(setDebugSettings({ coinjoinAllowNoTor: !debug?.coinjoinAllowNoTor }));

    return (
        <>
            {(Object.keys(COINJOIN_NETWORKS) as NetworkSymbol[]).map(symbol => {
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
            <SectionItem data-test="@settings/debug/coinjoin-allow-no-tor">
                <TextColumn
                    title="Allow no Tor"
                    description="Normally, coinjoin is allowed only when Tor is running. You may allow coinjoin without running Tor"
                />
                <ActionColumn>
                    <Switch
                        onChange={handleTorChange}
                        isChecked={debug?.coinjoinAllowNoTor ?? false}
                        data-test="@settings/debug/coinjoin/allow-no-tor-checkbox"
                    />
                </ActionColumn>
            </SectionItem>
        </>
    );
};
