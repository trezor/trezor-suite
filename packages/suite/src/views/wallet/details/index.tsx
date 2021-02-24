import React from 'react';
import styled from 'styled-components';
import { P } from '@trezor/components';
import { WalletLayout } from '@wallet-components';
import { useDevice, useActions, useSelector } from '@suite-hooks';
import { Translation, Card } from '@suite-components';
import { ExtendedMessageDescriptor } from '@suite-types';
import * as modalActions from '@suite-actions/modalActions';
import { getAccountTypeIntl, getBip43Shortcut } from '@wallet-utils/accountUtils';
import { ActionColumn, Row, TextColumn, ActionButton } from '@suite-components/Settings';
import {
    WIKI_XPUB_URL,
    WIKI_BECH32_URL,
    WIKI_P2SH_URL,
    WIKI_P2PHK_URL,
} from '@suite-constants/urls';
import { CARD_PADDING_SIZE } from '@suite-constants/layout';

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

    const accountTypeName = getAccountTypeIntl(account.accountType);
    const bip43 = getBip43Shortcut(account.path);
    let accountTypeDesc: ExtendedMessageDescriptor['id'] = 'TR_ACCOUNT_DETAILS_TYPE_P2PKH';
    let accountTypeShortcut: ExtendedMessageDescriptor['id'] = 'TR_ACCOUNT_TYPE_P2PKH';
    let accountTypeUrl = WIKI_P2PHK_URL;
    if (bip43 === 'bech32') {
        accountTypeDesc = 'TR_ACCOUNT_DETAILS_TYPE_BECH32';
        accountTypeShortcut = 'TR_ACCOUNT_TYPE_BECH32';
        accountTypeUrl = WIKI_BECH32_URL;
    }
    if (bip43 === 'p2sh') {
        accountTypeDesc = 'TR_ACCOUNT_DETAILS_TYPE_P2SH';
        accountTypeShortcut = 'TR_ACCOUNT_TYPE_P2SH';
        accountTypeUrl = WIKI_P2SH_URL;
    }

    return (
        <WalletLayout title="TR_ACCOUNT_DETAILS_HEADER" account={selectedAccount}>
            <StyledCard title={<Translation id="TR_ACCOUNT_DETAILS_HEADER" />} largePadding>
                <StyledRow>
                    <TextColumn
                        title={<Translation id="TR_ACCOUNT_DETAILS_TYPE_HEADER" />}
                        description={<Translation id={accountTypeDesc} />}
                        learnMore={accountTypeUrl}
                    />
                    <AccountTypeLabel>
                        <P size="small">
                            <Translation id={accountTypeName} />
                        </P>
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
