import React from 'react';
import styled from 'styled-components';
import { Select, CoinLogo } from '@trezor/components';
import { Network, ExternalNetwork } from '@wallet-types';

const buildNetworkOption = (network: Network | ExternalNetwork) => ({
    value: network.symbol,
    label: network.name,
});

type Option = ReturnType<typeof buildNetworkOption>;

const StyledSelect = styled(Select)`
    min-width: 77px;
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
    networks: (Network | ExternalNetwork)[];
    setSelectedNetwork: (n: Network['symbol'] | ExternalNetwork['symbol']) => void;
}

const NetworkSelect = ({ selectedNetwork, networks, setSelectedNetwork }: Props) => (
    <StyledSelect
        placeholder="Select network..."
        isSearchable={false}
        isClearable={false}
        value={buildNetworkOption(selectedNetwork || networks[0])}
        options={networks.map(n => buildNetworkOption(n))}
        formatOptionLabel={NetworkOption}
        onChange={(option: Option) => setSelectedNetwork(option.value)}
    />
);

export default NetworkSelect;
