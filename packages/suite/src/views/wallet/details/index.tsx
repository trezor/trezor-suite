import React from 'react';
import styled from 'styled-components';
import { P } from '@trezor/components';
import { WalletLayout } from '@wallet-components';
import { useDevice, useActions, useSelector } from '@suite-hooks';
import { Translation, Card } from '@suite-components';
import { ExtendedMessageDescriptor } from '@suite-types';
import * as modalActions from '@suite-actions/modalActions';
import { getAccountTypeIntl, getBip43Intl } from '@wallet-utils/accountUtils';
import { ActionColumn, Row, TextColumn, ActionButton } from '@suite-components/Settings';
import {
    WIKI_XPUB_URL,
    WIKI_BECH32_URL,
    WIKI_P2SH_URL,
    WIKI_P2PKH_URL,
} from '@suite-constants/urls';
import { CARD_PADDING_SIZE } from '@suite-constants/layout';
import { NETWORKS } from '@wallet-config';

const AccountTypeLabel = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 20px;

    div:first-child {
        padding-right: 8px;
    }
`;

const StyledCard = styled(Card)`
    flex-direction: column;
    padding-top: ${CARD_PADDING_SIZE};
    padding-bottom: ${CARD_PADDING_SIZE};
`;

const StyledRow = styled(Row)`
    padding-top: 0;
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
        accountTypes && accountTypes.length > 1 ? getAccountTypeIntl(account.path) : undefined;
    const accountTypeShortcut = getBip43Intl(account.path);

    let accountTypeDesc: ExtendedMessageDescriptor['id'] = 'TR_ACCOUNT_DETAILS_TYPE_P2PKH';
    let accountTypeUrl = WIKI_P2PKH_URL;
    if (accountTypeShortcut === 'TR_ACCOUNT_TYPE_BECH32') {
        accountTypeDesc = 'TR_ACCOUNT_DETAILS_TYPE_BECH32';
        accountTypeUrl = WIKI_BECH32_URL;
    }
    if (accountTypeShortcut === 'TR_ACCOUNT_TYPE_P2SH') {
        accountTypeDesc = 'TR_ACCOUNT_DETAILS_TYPE_P2SH';
        accountTypeUrl = WIKI_P2SH_URL;
    }

    return (
        <WalletLayout
            title="TR_ACCOUNT_DETAILS_HEADER"
            account={selectedAccount}
            showEmptyHeaderPlaceholder
        >
            <StyledCard largePadding>
                <StyledRow>
                    <TextColumn
                        title={<Translation id="TR_ACCOUNT_DETAILS_TYPE_HEADER" />}
                        description={<Translation id={accountTypeDesc} />}
                        learnMore={accountTypeUrl}
                    />
                    <AccountTypeLabel>
                        {accountTypeName && (
                            <P size="small">
                                <NoWrap>
                                    <Translation id={accountTypeName} />
                                </NoWrap>
                            </P>
                        )}
                        <P size="tiny">
                            <Translation id={accountTypeShortcut} />
                        </P>
                    </AccountTypeLabel>
                </StyledRow>
                <Row>
                    <TextColumn
                        title={<Translation id="TR_ACCOUNT_DETAILS_XPUB_HEADER" />}
                        description={<Translation id="TR_ACCOUNT_DETAILS_XPUB" />}
                        learnMore={WIKI_XPUB_URL}
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
            </StyledCard>
        </WalletLayout>
    );
};

export default Details;
