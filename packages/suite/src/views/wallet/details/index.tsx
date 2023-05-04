import React from 'react';
import styled from 'styled-components';

import { P, variables } from '@trezor/components';
import { HELP_CENTER_XPUB_URL } from '@trezor/urls';
import { WalletLayout } from '@wallet-components';
import { useDevice, useActions, useSelector, useDiscovery } from '@suite-hooks';
import { Card, Translation } from '@suite-components';
import * as modalActions from '@suite-actions/modalActions';
import {
    getAccountTypeName,
    getAccountTypeTech,
    getAccountTypeUrl,
    getAccountTypeDesc,
} from '@suite-common/wallet-utils';
import { ActionColumn, Row, TextColumn, ActionButton } from '@suite-components/Settings';
import { CARD_PADDING_SIZE } from '@suite-constants/layout';
import { NETWORKS } from '@wallet-config';
import { CoinjoinLogs } from '@wallet-components/PrivacyAccount/CoinjoinLogs';
import { CoinjoinSetup } from '@wallet-components/PrivacyAccount/CoinjoinSetup';

const Heading = styled.h3`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    margin: 14px 0 4px 0;
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

    div:first-child {
        margin-bottom: 8px;
    }
`;

const StyledCard = styled(Card)`
    flex-direction: column;
    padding-top: ${CARD_PADDING_SIZE};
    padding-bottom: ${CARD_PADDING_SIZE};

    :first-child {
        padding-top: 0;
    }

    :last-child {
        padding-bottom: 0;
    }
`;

const NoWrap = styled.span`
    white-space: nowrap;
`;

const Details = () => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    const { openModal } = useActions({
        openModal: modalActions.openModal,
    });

    const { device, isLocked } = useDevice();
    const { isDiscoveryRunning } = useDiscovery();
    if (!device || selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_ACCOUNT_DETAILS_HEADER" account={selectedAccount} />;
    }

    const { account } = selectedAccount;
    const isDisabled = !!device.authConfirm || isLocked();

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

    const isCoinjoinAccount = account.accountType === 'coinjoin';

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

                <StyledCard largePadding>
                    <Row>
                        <TextColumn
                            title={<Translation id="TR_ACCOUNT_DETAILS_TYPE_HEADER" />}
                            description={<Translation id={accountTypeDesc} />}
                            buttonLink={accountTypeUrl}
                        />
                        <AccountTypeLabel>
                            {accountTypeName && (
                                <P size="small" weight="medium">
                                    <NoWrap>
                                        <Translation id={accountTypeName} />
                                    </NoWrap>
                                </P>
                            )}
                            <P size="tiny">
                                (<Translation id={accountTypeTech} />)
                            </P>
                        </AccountTypeLabel>
                    </Row>
                    {!isCoinjoinAccount && (
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
                                    onClick={() =>
                                        openModal({
                                            type: 'xpub',
                                            xpub: account.descriptor,
                                            accountPath: account.path,
                                            accountIndex: account.index,
                                            accountType: account.accountType,
                                            symbol: account.symbol,
                                            accountLabel: account.metadata.accountLabel,
                                        })
                                    }
                                    isDisabled={isDisabled}
                                    isLoading={isDiscoveryRunning}
                                >
                                    <Translation id="TR_ACCOUNT_DETAILS_XPUB_BUTTON" />
                                </ActionButton>
                            </ActionColumn>
                        </Row>
                    )}
                </StyledCard>

                {isCoinjoinAccount && <CoinjoinLogs />}
            </Cards>
        </WalletLayout>
    );
};

export default Details;
