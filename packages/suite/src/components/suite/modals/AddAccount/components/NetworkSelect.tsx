import React from 'react';
import styled from 'styled-components';
import { Select, CoinLogo } from '@trezor/components';
import { Network } from '@wallet-types';

const buildNetworkOption = (network: Network) => ({
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
`;

const LogoWrapper = styled.div`
    min-width: 40px;
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
    selectedNetwork?: Network;
    networks: Network[];
    setSelectedNetwork: (n: string) => void;
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
