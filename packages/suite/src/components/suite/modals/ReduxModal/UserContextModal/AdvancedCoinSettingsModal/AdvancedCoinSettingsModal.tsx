import styled from 'styled-components';
import { CoinLogo, variables } from '@trezor/components';
import { Modal, Translation } from 'src/components/suite';
import { NETWORKS } from 'src/config/wallet';
import { NetworkSymbol } from 'src/types/wallet';
import { CustomBackends } from './CustomBackends/CustomBackends';

const Section = styled.div`
    display: flex;
    flex-direction: column;
`;

const Heading = styled.div`
    display: flex;
    align-items: center;
    line-height: initial;

    > * + * {
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
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

interface AdvancedCoinSettingsModalProps {
    coin: NetworkSymbol;
    onCancel: () => void;
}

export const AdvancedCoinSettingsModal = ({ coin, onCancel }: AdvancedCoinSettingsModalProps) => {
    const network = NETWORKS.find(network => network.symbol === coin);

    if (!network) {
        return null;
    }

    return (
        <Modal
            isCancelable
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
            <Section>
                <CustomBackends network={network} onCancel={onCancel} />
            </Section>
        </Modal>
    );
};
