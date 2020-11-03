import React from 'react';
import { UnavailableCapability } from 'trezor-connect';
import { Translation } from '@suite-components/Translation';

import styled from 'styled-components';
import { H2, P, colors } from '@trezor/components';
import { Network } from '@wallet-types';

const Wrapper = styled.div`
    width: 100%;
    margin-top: 20px;
    color: ${colors.BLACK50};
`;

const StyledP = styled(P)`
    color: ${colors.BLACK50};
`;

interface Props {
    capability: UnavailableCapability;
    network: Network;
}

const Header = ({ capability }: { capability: UnavailableCapability }) => {
    switch (capability) {
        case 'no-capability':
            return <Translation id="FW_CAPABILITY_NO_CAPABILITY" />;
        case 'no-support':
            return <Translation id="FW_CAPABILITY_NO_SUPPORT" />;
        case 'update-required':
            return <Translation id="FW_CAPABILITY_UPDATE_REQUIRED" />;
        // case 'trezor-connect-outdated':
        default:
            return <Translation id="FW_CAPABILITY_CONNECT_OUTDATED" />;
    }
};

const Description = ({
    capability,
    networkName,
}: {
    capability: UnavailableCapability;
    networkName: string;
}) => {
    switch (capability) {
        case 'no-capability':
        case 'no-support':
            return <Translation id="FW_CAPABILITY_NO_CAPABILITY_DESC" values={{ networkName }} />;
        case 'update-required':
            return <Translation id="FW_CAPABILITY_UPDATE_REQUIRED_DESC" values={{ networkName }} />;
        default:
            return null;
    }
};

const NetworkUnavailable = ({ capability, network }: Props) => {
    return (
        <Wrapper>
            <H2>
                <Header capability={capability} />
            </H2>
            <StyledP size="small">
                <Description capability={capability} networkName={network.name} />
            </StyledP>
        </Wrapper>
    );
};

export default NetworkUnavailable;
