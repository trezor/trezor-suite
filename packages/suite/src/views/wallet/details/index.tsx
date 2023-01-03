import React from 'react';
import styled from 'styled-components';
import { P } from '@trezor/components';
import { HELP_CENTER_XPUB_URL } from '@trezor/urls';
import { WalletLayout } from '@wallet-components';
import { useDevice, useActions, useSelector } from '@suite-hooks';
import { Translation, Card } from '@suite-components';
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
import { AnonymityLevelSetupCard } from '@wallet-components/PrivacyAccount/AnonymityLevelSetupCard';
import { CoinJoinLogs } from '@wallet-components/PrivacyAccount/CoinJoinLogs';

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
    if (!device || selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_ACCOUNT_DETAILS_HEADER" account={selectedAccount} />;
    }

    const { account } = selectedAccount;
    const disabled = !!device.authConfirm;

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
            showEmptyHeaderPlaceholder
        >
            {isCoinjoinAccount && <AnonymityLevelSetupCard />}

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
                                isLoading={isLocked() && !disabled}
                                isDisabled={disabled}
                            >
                                <Translation id="TR_ACCOUNT_DETAILS_XPUB_BUTTON" />
                            </ActionButton>
                        </ActionColumn>
                    </Row>
                )}
            </StyledCard>

            {isCoinjoinAccount && <CoinJoinLogs />}
        </WalletLayout>
    );
};

export default Details;
