import React from 'react';
import styled from 'styled-components';
import { H2, P } from '@trezor/components';
import { WalletLayout } from '@wallet-components';
import { SUITE } from '@suite-actions/constants';
import { Props } from './Container';
import { Translation } from '@suite-components';

import { getBip43Shortcut } from '@wallet-utils/accountUtils';

import { Section, ActionColumn, Row, TextColumn, ActionButton } from '@suite-components/Settings';

import {
    WIKI_XPUB_URL,
    WIKI_BECH32_URL,
    WIKI_P2SH_URL,
    WIKI_P2PHK_URL,
} from '@suite-constants/urls';

const AccountTypeLabel = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 20px;
    p:first-child {
        padding-right: 8px;
    }
`;

export default ({ selectedAccount, locks, device, openModal }: Props) => {
    if (!device || selectedAccount.status !== 'loaded') {
        return <WalletLayout title="Account details" account={selectedAccount} />;
    }

    const { account } = selectedAccount;
    const locked = locks.includes(SUITE.LOCK_TYPE.DEVICE) || locks.includes(SUITE.LOCK_TYPE.UI);
    const disabled = !!device.authConfirm;

    let accountTypeName = messages.TR_ACCOUNT_TYPE_NORMAL;
    if (account.accountType !== 'normal') {
        accountTypeName =
            account.accountType === 'segwit'
                ? messages.TR_ACCOUNT_TYPE_SEGWIT
                : messages.TR_ACCOUNT_TYPE_LEGACY;
    }

    const bip43 = getBip43Shortcut(account.path);
    let accountTypeDesc = messages.TR_ACCOUNT_DETAILS_TYPE_P2PKH;
    let accountTypeShortcut = messages.TR_ACCOUNT_TYPE_P2PKH;
    let accountTypeUrl = WIKI_P2PHK_URL;
    if (bip43 === 'bech32') {
        accountTypeDesc = messages.TR_ACCOUNT_DETAILS_TYPE_BECH32;
        accountTypeShortcut = messages.TR_ACCOUNT_TYPE_BECH32;
        accountTypeUrl = WIKI_BECH32_URL;
    }
    if (bip43 === 'p2sh') {
        accountTypeDesc = messages.TR_ACCOUNT_DETAILS_TYPE_P2SH;
        accountTypeShortcut = messages.TR_ACCOUNT_TYPE_P2SH;
        accountTypeUrl = WIKI_P2SH_URL;
    }

    return (
        <WalletLayout title="Account details" account={selectedAccount}>
            <H2>
                <Translation id="TR_ACCOUNT_DETAILS_HEADER" />
            </H2>
            <Section>
                <Row>
                    <TextColumn
                        title={<Translation id="TR_ACCOUNT_DETAILS_TYPE_HEADER" />}
                        description={<Translation {...accountTypeDesc} />}
                        learnMore={accountTypeUrl}
                    />
                    <AccountTypeLabel>
                        <P size="small">
                            <Translation {...accountTypeName} />
                        </P>
                        <P size="tiny">
                            <Translation {...accountTypeShortcut} />
                        </P>
                    </AccountTypeLabel>
                </Row>
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
                                })
                            }
                            isLoading={locked && !disabled}
                            isDisabled={disabled}
                        >
                            <Translation id="TR_ACCOUNT_DETAILS_XPUB_BUTTON" />
                        </ActionButton>
                    </ActionColumn>
                </Row>
            </Section>
        </WalletLayout>
    );
};
