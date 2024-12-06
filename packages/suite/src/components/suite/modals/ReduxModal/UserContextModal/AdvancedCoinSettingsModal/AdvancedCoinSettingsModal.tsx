import styled from 'styled-components';

import { variables } from '@trezor/components';
import { getNetwork, type NetworkSymbol } from '@suite-common/wallet-config';
import { CoinLogo } from '@trezor/product-components';

import { Modal, Translation } from 'src/components/suite';
import { getCoinLabel } from 'src/utils/suite/getCoinLabel';
import { useSelector } from 'src/hooks/suite';

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
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
`;

interface AdvancedCoinSettingsModalProps {
    symbol: NetworkSymbol;
    onCancel: () => void;
}

export const AdvancedCoinSettingsModal = ({ symbol, onCancel }: AdvancedCoinSettingsModalProps) => {
    const blockchain = useSelector(state => state.wallet.blockchain);
    const network = getNetwork(symbol);

    const { name, features, testnet: isTestnet } = network;
    const hasCustomBackend = !!blockchain[symbol].backends.selected;
    const label = getCoinLabel(features, isTestnet, hasCustomBackend);

    return (
        <Modal
            isCancelable
            onCancel={onCancel}
            heading={
                <Heading>
                    <CoinLogo symbol={symbol} />

                    <Header>
                        <span>{name}</span>

                        {label && (
                            <Subheader>
                                <Translation id={label} />
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
