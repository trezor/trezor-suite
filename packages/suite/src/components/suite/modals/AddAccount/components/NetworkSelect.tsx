import React from 'react';
import styled from 'styled-components';
import { Select, CoinLogo } from '@trezor/components';
import { Network } from '@wallet-types';
import { Translation } from '@suite-components';

const buildNetworkOption = (network: Network) => ({
    value: network,
    label: network.name,
});

const buildNetworkOptions = (networks: Network[]) => {
    const mainNetworks = networks.filter(n => !n.testnet);
    const testNetworks = networks.filter(n => n.testnet);
    return [
        {
            label: <Translation id="MODAL_ADD_ACCOUNT_NETWORK_MAINNET" />,
            options: mainNetworks.map(n => buildNetworkOption(n)),
        },
        {
            label: <Translation id="MODAL_ADD_ACCOUNT_NETWORK_TESTNET" />,
            options: testNetworks.map(n => buildNetworkOption(n)),
        },
    ];
};

type Option = ReturnType<typeof buildNetworkOption>;

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
            <CoinLogo size={20} symbol={value.symbol} />
        </LogoWrapper>
        <div>{label}</div>
    </OptionWrapper>
);

const customNetworkFilter = (option: Option, searchText: string) => {
    const searchString = searchText.toLowerCase();

    const matchLabel = option.label.toLowerCase().includes(searchString);
    const matchSymbol = option.value.symbol.toLowerCase().includes(searchString);
    // match XRP/TXRP when user types "Ripple"
    const matchXRPAlternativeName =
        option.value.networkType === 'ripple' && 'ripple'.includes(searchString);

    return matchLabel || matchSymbol || matchXRPAlternativeName;
};

interface Props {
    network: Network;
    internalNetworks: Network[];
    setSelectedNetwork: (n: Network) => void;
    isDisabled?: boolean;
}

const NetworkSelect = ({ network, internalNetworks, setSelectedNetwork, isDisabled }: Props) => (
    <Select
        hideTextCursor
        useKeyPressScroll
        width={250}
        maxMenuHeight={220}
        isClearable={false}
        filterOption={customNetworkFilter}
        value={buildNetworkOption(network)}
        options={buildNetworkOptions(internalNetworks)}
        formatOptionLabel={NetworkOption}
        onChange={(option: Option) => setSelectedNetwork(option.value)}
        noOptionsMessage={() => <Translation id="TR_COIN_NOT_FOUND" />}
        isDisabled={isDisabled}
    />
);

export default NetworkSelect;
