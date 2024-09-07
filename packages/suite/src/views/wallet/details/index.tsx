import styled from 'styled-components';

import { getAccountTypeTech } from '@suite-common/wallet-utils';
import { Paragraph, variables, Card, Column } from '@trezor/components';

import { ActionButton, ActionColumn, TextColumn, Translation } from 'src/components/suite';

import { HELP_CENTER_BIP32_URL, HELP_CENTER_XPUB_URL } from '@trezor/urls';
import { showXpub } from 'src/actions/wallet/publicKeyActions';
import { WalletLayout } from 'src/components/wallet';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { CoinjoinLogs } from './CoinjoinLogs';
import { CoinjoinSetup } from './CoinjoinSetup/CoinjoinSetup';
import { RescanAccount } from './RescanAccount';
import { spacings } from '@trezor/theme';
import { Row } from './Row';
import { AccountTypeDescription } from 'src/components/suite/modals/ReduxModal/UserContextModal/AddAccountModal/AccountTypeSelect/AccountTypeDescription';
import { AccountTypeBadge } from 'src/components/suite/AccountTypeBadge';

const Heading = styled.h3`
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    margin: 14px 0 4px;
    text-transform: uppercase;
`;

const Cards = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const AccountTypeLabel = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    line-height: 20px;
    text-align: center;
    min-width: 170px;
    gap: 8px;
`;

const StyledActionButton = styled(ActionButton)`
    min-width: 170px;
`;

const Details = () => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const dispatch = useDispatch();

    const { device, isLocked } = useDevice();

    if (!device || selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_ACCOUNT_DETAILS_HEADER" account={selectedAccount} />;
    }

    const { account } = selectedAccount;
    const locked = isLocked(true);
    const disabled = !!device.authConfirm || locked;

    const accountTypeTech = getAccountTypeTech(account.path);

    const isCoinjoinAccount = account.backendType === 'coinjoin';

    // xPub is required by networks using UTXO model. Bitcoin, Bitcoin Cash, Litecoin, Dogecoin, Cardano etc.
    const shouldDisplayXpubSection =
        account.networkType === 'bitcoin' || account.networkType === 'cardano';

    const handleXpubClick = () => dispatch(showXpub());

    return (
        <WalletLayout
            title="TR_ACCOUNT_DETAILS_HEADER"
            account={selectedAccount}
            showEmptyHeaderPlaceholder={!isCoinjoinAccount}
        >
            <Cards>
                {isCoinjoinAccount && (
                    <>
                        <Heading>
                            <Translation id="TR_COINJOIN_SETUP_HEADING" />
                        </Heading>
                        <CoinjoinSetup accountKey={account.key} />
                    </>
                )}

                <Card>
                    <Column gap={spacings.md} hasDivider>
                        <Row>
                            <TextColumn
                                title={<Translation id="TR_ACCOUNT_DETAILS_TYPE_HEADER" />}
                                description={
                                    <AccountTypeDescription
                                        bip43Path={account.path}
                                        accountType={account.accountType}
                                        symbol={account.symbol}
                                        networkType={account.networkType}
                                    />
                                }
                            />
                            <AccountTypeLabel>
                                <AccountTypeBadge
                                    accountType={account.accountType}
                                    shouldDisplayNormalType
                                    path={account.path}
                                    networkType={account.networkType}
                                    onElevation={true}
                                />
                                <Paragraph typographyStyle="label">
                                    (<Translation id={accountTypeTech} />)
                                </Paragraph>
                            </AccountTypeLabel>
                        </Row>
                        <Row>
                            <TextColumn
                                title={<Translation id="TR_ACCOUNT_DETAILS_PATH_HEADER" />}
                                description={<Translation id="TR_ACCOUNT_DETAILS_PATH_DESC" />}
                                buttonLink={HELP_CENTER_BIP32_URL}
                            />
                            <AccountTypeLabel>
                                <Paragraph typographyStyle="hint">{account.path}</Paragraph>
                            </AccountTypeLabel>
                        </Row>
                        {!isCoinjoinAccount ? (
                            shouldDisplayXpubSection && (
                                <Row>
                                    <TextColumn
                                        title={<Translation id="TR_ACCOUNT_DETAILS_XPUB_HEADER" />}
                                        description={<Translation id="TR_ACCOUNT_DETAILS_XPUB" />}
                                        buttonLink={HELP_CENTER_XPUB_URL}
                                    />
                                    <ActionColumn>
                                        <StyledActionButton
                                            variant="tertiary"
                                            data-testid="@wallets/details/show-xpub-button"
                                            onClick={handleXpubClick}
                                            isDisabled={disabled}
                                            isLoading={locked}
                                        >
                                            <Translation id="TR_ACCOUNT_DETAILS_XPUB_BUTTON" />
                                        </StyledActionButton>
                                    </ActionColumn>
                                </Row>
                            )
                        ) : (
                            <RescanAccount account={account} />
                        )}
                    </Column>
                </Card>

                {isCoinjoinAccount && <CoinjoinLogs />}
            </Cards>
        </WalletLayout>
    );
};

export default Details;
