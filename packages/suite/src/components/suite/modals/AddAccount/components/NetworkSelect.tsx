import React from 'react';
import styled from 'styled-components';
import { Select, CoinLogo } from '@trezor/components';
import { Network, ExternalNetwork } from '@wallet-types';

const buildNetworkOption = (network: Network | ExternalNetwork) => ({
    value: network.symbol,
    label: network.name,
});

const buildNetworkOptions = (networks: Network[], externalNetworks: ExternalNetwork[]) => {
    const mainNetworks = networks.filter(n => !n.testnet);
    const testNetworks = networks.filter(n => n.testnet);
    return [
        {
            label: 'Main networks',
            options: mainNetworks.map(n => buildNetworkOption(n)),
        },
        {
            label: 'Testnet networks',
            options: testNetworks.map(n => buildNetworkOption(n)),
        },
        {
            label: 'External networks',
            options: externalNetworks.map(n => buildNetworkOption(n)),
        },
    ];
};

type Option = ReturnType<typeof buildNetworkOption>;

const StyledSelect = styled(Select)`
    margin: 0 0 10px 0;
`;

const OptionWrapper = styled.div`
    display: flex;
    align-items: center;
    height: 30px;
`;

const LogoWrapper = styled.div`
    padding-left: 8px;
    padding-right: 6px;
    display: flex;
    align-items: center;
`;

const NetworkOption = ({ value, label }: Option) => (
    <OptionWrapper>
        <LogoWrapper>
            <CoinLogo size={25} symbol={value} />
        </LogoWrapper>
        <div>{label}</div>
    </OptionWrapper>
);

interface Props {
    selectedNetwork?: Network | ExternalNetwork;
    networks: Network[];
    externalNetworks: ExternalNetwork[];
    setSelectedNetwork: (n: Network['symbol'] | ExternalNetwork['symbol']) => void;
}

const NetworkSelect = ({
    selectedNetwork,
    networks,
    externalNetworks,
    setSelectedNetwork,
}: Props) => (
    <StyledSelect
        placeholder="Select network..."
        isSearchable={false}
        isClearable={false}
        value={buildNetworkOption(selectedNetwork || networks[0])}
        options={buildNetworkOptions(networks, externalNetworks)}
        formatOptionLabel={NetworkOption}
        onChange={(option: Option) => setSelectedNetwork(option.value)}
    />
);

export default NetworkSelect;
