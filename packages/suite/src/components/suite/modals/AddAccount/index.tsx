import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { H2, Button, P, Link, colors, variables } from '@trezor/components';
import { Translation, ExternalLink } from '@suite-components';
import { changeAccountVisibility } from '@wallet-actions/accountActions';
import { changeCoinVisibility } from '@settings-actions/walletSettingsActions';
import * as routerActions from '@suite-actions/routerActions';
import { NETWORKS, EXTERNAL_NETWORKS } from '@wallet-config';
import { AppState, Dispatch, TrezorDevice } from '@suite-types';
import { Account, Network, ExternalNetwork } from '@wallet-types';
import ModalWrapper from '@suite-components/ModalWrapper';

import NetworkSelect from './components/NetworkSelect';
import AccountTypeSelect from './components/AccountTypeSelect';
import ExternalWallet from './components/ExternalWallet';
import AddAccountButton from './components/AddAccountButton';
import { WIKI_BECH32_URL } from '@suite-constants/urls';

const Wrapper = styled(ModalWrapper)`
    flex-direction: column;
    width: 100%;
    max-width: 600px;
    min-height: 530px;
`;

const Actions = styled.div`
    display: flex;
    justify-content: space-between;
`;

const Description = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${colors.BLACK50};
    margin-bottom: 32px;
`;

const Row = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 0px;

    & + & {
        border-top: 1px solid ${colors.BLACK96};
    }
`;

const RowTitle = styled.div`
    display: flex;
    color: ${colors.BLACK0};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const StyledP = styled(P)`
    color: ${colors.BLACK50};
    margin-bottom: 32px;
`;

const Expander = styled.div`
    display: flex;
    flex: 1;
`;

const isNetworkExternal = (n: Network | ExternalNetwork | undefined): n is ExternalNetwork => {
    return n !== undefined && EXTERNAL_NETWORKS.find(e => e.symbol === n.symbol) !== undefined;
};
const isNetworkInternal = (n: Network | ExternalNetwork | undefined): n is Network => {
    return n !== undefined && NETWORKS.find(e => e.symbol === n.symbol) !== undefined;
};

const EnableNetwork = (props: {
    selectedNetwork: Network;
    onEnableNetwork: (symbol: Network['symbol']) => void;
}) => (
    <>
        <Button
            variant="primary"
            onClick={() => props.onEnableNetwork(props.selectedNetwork.symbol)}
        >
            <Translation
                id="TR_ENABLE_NETWORK_BUTTON"
                values={{ networkName: props.selectedNetwork.name }}
            />
        </Button>
    </>
);

const mapStateToProps = (state: AppState) => ({
    accounts: state.wallet.accounts,
    enabledNetworks: state.wallet.settings.enabledNetworks,
    router: state.router,
    selectedAccount: state.wallet.selectedAccount,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    changeAccountVisibility: bindActionCreators(changeAccountVisibility, dispatch),
    changeCoinVisibility: bindActionCreators(changeCoinVisibility, dispatch),
    goto: bindActionCreators(routerActions.goto, dispatch),
});

type NetworkSymbol = Network['symbol'] | ExternalNetwork['symbol'];

type Props = {
    device: TrezorDevice;
    onCancel: () => void;
} & ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps>;

const AddAccount = (props: Props) => {
    // Collect all Networks without "accountType" (normal)
    const internalNetworks = NETWORKS.filter(n => !n.accountType && !n.isHidden);
    const externalNetworks = EXTERNAL_NETWORKS.filter(n => !n.isHidden);

    // Collect accounts for selected device
    const accounts = props.accounts.filter(a => a.deviceState === props.device.state);

    // Use component state, default value is currently selected network or first network item on the list (btc)
    const { account } = props.selectedAccount;
    let preselectedNetwork;
    if (props.router.app === 'wallet' && account) {
        preselectedNetwork = internalNetworks.find(n => n.symbol === account.symbol);
    }
    const [selectedType, setSelectedType] = useState<Network['accountType']>(undefined);
    const [selectedSymbol, setSelectedSymbol] = useState<NetworkSymbol>(
        preselectedNetwork ? preselectedNetwork.symbol : internalNetworks[0].symbol,
    );

    const accountTypes = NETWORKS.filter(n => n.symbol === selectedSymbol);
    // Find selected network (from component state value)
    const selectedNetwork = selectedType
        ? accountTypes.find(n => (n.accountType || 'normal') === selectedType)
        : [...internalNetworks, ...externalNetworks].find(n => n.symbol === selectedSymbol);

    const isExternal = isNetworkExternal(selectedNetwork);
    const isInternal = isNetworkInternal(selectedNetwork);

    const isNetworkDisabled =
        selectedNetwork && isNetworkInternal(selectedNetwork)
            ? !props.enabledNetworks.includes(selectedNetwork?.symbol)
            : false;

    const availableAccounts = accounts.filter(a => a.symbol === selectedNetwork?.symbol && a.empty);

    const getEmptyAccounts = (n: Network) => {
        if (!n) return [];
        return availableAccounts.filter(a => a.accountType === (n.accountType || 'normal'));
    };

    const filteredAccountTypes = accountTypes.filter(t => {
        const emptyAccounts = getEmptyAccounts(t);
        if (emptyAccounts.length === 0) return false;
        return true;
    });

    const onSelectAccountType = (type: Network['accountType']) => {
        setSelectedType(type);
    };

    const onSelectNetwork = (symbol: NetworkSymbol) => {
        setSelectedSymbol(symbol);
        setSelectedType(undefined);
    };

    const onEnableAccount = (account: Account) => {
        props.onCancel();
        props.changeAccountVisibility(account);
        props.goto('wallet-index', {
            symbol: account.symbol,
            accountIndex: account.index,
            accountType: account.accountType,
        });
    };

    return (
        <Wrapper>
            <H2>
                <Translation id="TR_ADD_NEW_ACCOUNT" values={{ deviceLabel: props.device.label }} />
            </H2>

            <Description>
                <Translation id="TR_EXPLAIN_HOW_ACCOUNT_WORK" />
            </Description>
            <Row>
                <RowTitle>
                    <Translation id="TR_CRYPTOCURRENCY" />
                </RowTitle>
                <NetworkSelect
                    selectedNetwork={selectedNetwork}
                    networks={internalNetworks}
                    externalNetworks={externalNetworks}
                    setSelectedNetwork={onSelectNetwork}
                />
            </Row>
            {!isNetworkDisabled && accountTypes.length > 1 && (
                <Row>
                    <RowTitle>
                        <Translation id="TR_ACCOUNT_TYPE" />
                    </RowTitle>
                    <AccountTypeSelect
                        selectedNetwork={selectedNetwork}
                        accountTypes={filteredAccountTypes}
                        onSelectAccountType={onSelectAccountType}
                    />
                </Row>
            )}

            {selectedNetwork?.symbol === 'btc' &&
                (selectedNetwork?.accountType || 'normal') === 'normal' && (
                    <StyledP size="small" textAlign="left">
                        <Translation id="TR_BECH32_USES_MOST_MODERN" />{' '}
                        <ExternalLink href={WIKI_BECH32_URL} size="small">
                            <Translation id="TR_LEARN_MORE" />
                        </ExternalLink>
                    </StyledP>
                )}

            <ExternalWallet selectedNetwork={selectedNetwork} />

            <Expander />

            <Actions>
                <Button variant="secondary" onClick={() => props.onCancel()}>
                    <Translation id="TR_CANCEL" />
                </Button>
                {isInternal && isNetworkDisabled && (
                    <EnableNetwork
                        selectedNetwork={selectedNetwork as Network}
                        onEnableNetwork={(symbol: Network['symbol']) => {
                            props.onCancel();
                            props.changeCoinVisibility(symbol, true);
                            props.goto('wallet-index', {
                                symbol,
                                accountIndex: 0,
                                accountType: 'normal',
                            });
                        }}
                    />
                )}

                {isExternal ? (
                    <Link href={(selectedNetwork as ExternalNetwork).url}>
                        <Button icon="EXTERNAL_LINK" variant="primary" onClick={props.onCancel}>
                            <Translation id="TR_GO_TO_EXTERNAL_WALLET" />
                        </Button>
                    </Link>
                ) : (
                    <AddAccountButton
                        network={selectedNetwork as Network}
                        accounts={getEmptyAccounts(selectedNetwork as Network)}
                        onEnableAccount={onEnableAccount}
                    />
                )}
            </Actions>
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(AddAccount);
