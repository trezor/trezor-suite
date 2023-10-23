import styled from 'styled-components';

import {
    getAccountTypeName,
    getAccountTypeTech,
    getAccountTypeUrl,
    getAccountTypeDesc,
} from '@suite-common/wallet-utils';
import { P, Card, variables } from '@trezor/components';

import { ActionButton, ActionColumn, TextColumn, Translation } from 'src/components/suite';

import { HELP_CENTER_BIP32_URL, HELP_CENTER_XPUB_URL } from '@trezor/urls';
import { showXpub } from 'src/actions/wallet/publicKeyActions';
import { WalletLayout } from 'src/components/wallet';
import { NETWORKS } from 'src/config/wallet';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { CoinjoinLogs } from './CoinjoinLogs';
import { CoinjoinSetup } from './CoinjoinSetup/CoinjoinSetup';
import { RescanAccount } from './RescanAccount';
import { Row } from './Row';

const Heading = styled.h3`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
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

const StyledCard = styled(Card)`
    flex-direction: column;

    > :first-child {
        padding-top: 0;
    }

    > :last-child {
        padding-bottom: 0;
    }
`;

const NoWrap = styled.span`
    white-space: nowrap;
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

    // check if all network types
    const accountTypes =
        account.networkType === 'bitcoin'
            ? NETWORKS.filter(n => n.symbol === account.symbol)
            : undefined;
    // display type name only if there is more than 1 network type
    const accountTypeName =
        accountTypes && accountTypes.length > 1 ? getAccountTypeName(account.path) : undefined;
    const accountTypeTech = getAccountTypeTech(account.path);
    const accountTypeUrl = getAccountTypeUrl(account.path);
    const accountTypeDesc = getAccountTypeDesc(account.path);
    const isCoinjoinAccount = account.backendType === 'coinjoin';

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

                <StyledCard paddingType="large">
                    <Row>
                        <TextColumn
                            title={<Translation id="TR_ACCOUNT_DETAILS_TYPE_HEADER" />}
                            description={<Translation id={accountTypeDesc} />}
                            buttonLink={accountTypeUrl}
                        />
                        <AccountTypeLabel>
                            {accountTypeName && (
                                <P type="hint">
                                    <NoWrap>
                                        <Translation id={accountTypeName} />
                                    </NoWrap>
                                </P>
                            )}
                            <P type="label">
                                (<Translation id={accountTypeTech} />)
                            </P>
                        </AccountTypeLabel>
                    </Row>
                    <Row>
                        <TextColumn
                            title={<Translation id="TR_ACCOUNT_DETAILS_PATH_HEADER" />}
                            description={<Translation id="TR_ACCOUNT_DETAILS_PATH_DESC" />}
                            buttonLink={HELP_CENTER_BIP32_URL}
                        />
                        <AccountTypeLabel>
                            <P size="small" weight="medium">
                                {account.path}
                            </P>
                        </AccountTypeLabel>
                    </Row>
                    {!isCoinjoinAccount ? (
                        <Row>
                            <TextColumn
                                title={<Translation id="TR_ACCOUNT_DETAILS_XPUB_HEADER" />}
                                description={<Translation id="TR_ACCOUNT_DETAILS_XPUB" />}
                                buttonLink={HELP_CENTER_XPUB_URL}
                            />
                            <ActionColumn>
                                <ActionButton
                                    variant="secondary"
                                    data-test="@wallets/details/show-xpub-button"
                                    onClick={handleXpubClick}
                                    isDisabled={disabled}
                                    isLoading={locked}
                                >
                                    <Translation id="TR_ACCOUNT_DETAILS_XPUB_BUTTON" />
                                </ActionButton>
                            </ActionColumn>
                        </Row>
                    ) : (
                        <RescanAccount account={account} />
                    )}
                </StyledCard>

                {isCoinjoinAccount && <CoinjoinLogs />}
            </Cards>
        </WalletLayout>
    );
};

export default Details;
