import React from 'react';
import styled from 'styled-components';
import { CoinLogo, variables } from '@trezor/components';
import { Modal, Translation } from '@suite-components';
import { NETWORKS } from '@wallet-config';
import { Network } from '@suite/types/wallet';
import { CustomBackends } from './components/CustomBackends';

const Section = styled.div`
    display: flex;
    flex-direction: column;
`;

const Heading = styled.div`
    display: flex;
    align-items: center;
    line-height: initial;
    & > * + * {
        margin-left: 16px;
    }
`;

const Header = styled.div`
    display: flex;
    flex-direction: column;
`;

const Subheader = styled.span`
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

interface Props {
    coin: Network['symbol'];
    onCancel: () => void;
}

const AdvancedCoinSettings = ({ coin, onCancel }: Props) => {
    const network = NETWORKS.find(n => n.symbol === coin);

    return network ? (
        <Modal
            cancelable
            onCancel={onCancel}
            heading={
                <Heading>
                    <CoinLogo symbol={network.symbol} />
                    <Header>
                        <span>{network.name}</span>
                        {network.label && (
                            <Subheader>
                                <Translation id={network.label} />
                            </Subheader>
                        )}
                    </Header>
                </Heading>
            }
        >
            {/* <AccountUnits /> */}
            <Section>
                <CustomBackends network={network} onCancel={onCancel} />
            </Section>

            {/* <CustomExplorerUrl /> */}
        </Modal>
    ) : null;
};

export default AdvancedCoinSettings;
