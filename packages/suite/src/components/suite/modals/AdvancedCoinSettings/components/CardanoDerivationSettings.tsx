import React from 'react';
import styled from 'styled-components';
import { variables, Select } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import { DerivationType } from '@wallet-types/cardano';
import { useActions, useSelector } from '@suite-hooks';
import * as accountActions from '@wallet-actions/accountActions';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    text-align: left;
`;

const Description = styled.span`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: 500;
    line-height: 1.57;
`;

const Heading = styled.span`
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: 500;
    line-height: 1.5;
    margin-bottom: 6px;
`;

const Row = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
`;

const Left = styled.div`
    margin: 10px 0 20px 0;
`;

const CardanoDerivationSettings = () => {
    const { disableAccounts, changeNetworks, setCardanoDerivationType } = useActions({
        disableAccounts: accountActions.disableAccounts,
        changeNetworks: walletSettingsActions.changeNetworks,
        setCardanoDerivationType: walletSettingsActions.setCardanoDerivationType,
    });
    const { enabledNetworks, cardanoDerivationType } = useSelector(state => ({
        cardanoDerivationType: state.wallet.settings.cardanoDerivationType,
        enabledNetworks: state.wallet.settings.enabledNetworks,
    }));

    return (
        <Wrapper>
            <Heading>
                <Translation id="SETTINGS_ADV_CARDANO_DERIVATION_TITLE" />
            </Heading>
            <Description>
                <Translation id="SETTINGS_ADV_CARDANO_DERIVATION_DESCRIPTION" />
            </Description>
            <Row>
                <Left>
                    <Select
                        hideTextCursor
                        useKeyPressScroll
                        width={170}
                        noTopLabel
                        value={cardanoDerivationType}
                        options={[
                            { label: 'Ledger', value: 0 },
                            { label: 'Icarus', value: 1 },
                            { label: 'Icarus Trezor', value: 2 },
                        ]}
                        onChange={(option: DerivationType) => {
                            setCardanoDerivationType(option);
                            const enabledNetworksCache = enabledNetworks;
                            const networksWithoutCardano = enabledNetworksCache.filter(
                                network => network !== 'ada' && network !== 'tada',
                            );

                            // run discovery again with new derivation type
                            changeNetworks(networksWithoutCardano);
                            disableAccounts();
                            changeNetworks(enabledNetworksCache);
                        }}
                        data-test="@select/cardano-derivation-type"
                    />
                </Left>
            </Row>
        </Wrapper>
    );
};

export default CardanoDerivationSettings;
