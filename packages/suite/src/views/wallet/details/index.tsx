import { type ReactNode } from 'react';
import { useDispatch } from 'react-redux';

import styled from 'styled-components';

import { AccountTypeBadge } from '@suite/account';
import { useDevice } from '@suite/device';
import { LearnMoreButton } from '@suite/external-links';
import { Translation, type TranslationKey } from '@suite/intl';
import { useReceiveDisabled } from '@suite/receive';
import { getAccountTypeTech } from '@suite-common/wallet-utils';
import { Button, Card, Column, InfoItem, Paragraph } from '@trezor/components';
import { typography } from '@trezor/theme';
import { HELP_CENTER_BIP32_URL, HELP_CENTER_XPUB_URL, type Url } from '@trezor/urls';

import { showXpub } from 'src/actions/wallet/publicKeyActions';
import { AccountTypeDescription } from 'src/components/suite/modals/ReduxModal/UserContextModal/AddAccountModal/AccountTypeSelect/AccountTypeDescription';
import { WalletLayout } from 'src/components/wallet';
import { useSelector } from 'src/hooks/suite';
import { ContentFlex, useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';

import { AccountNonce } from './AccountNonce';
import { CoinjoinLogs } from './CoinjoinLogs';
import { CoinjoinSetup } from './CoinjoinSetup/CoinjoinSetup';
import { RescanAccount } from './RescanAccount';
import { Bip329Labels } from '../labels/Bip329Labels';

const Heading = styled.h3`
    color: ${({ theme }) => theme.contentSecondary};
    ${typography['body-sm-strong']}
    margin: 14px 0 4px;
    text-transform: uppercase;
`;

type DetailsRowProps = {
    title: TranslationKey;
    description: ReactNode;
    children: ReactNode;
    learnMoreUrl?: Url;
};

const DetailsRow = ({ title, description, learnMoreUrl, children }: DetailsRowProps) => {
    const isContentBelowBreakpoint = useIsContentBelowBreakpoint();

    return (
        <ContentFlex gap={40} justifyContent="space-between">
            <InfoItem
                label={<Translation id={title} />}
                typographyStyle="body-md"
                intent="neutral"
                priority="primary"
                gap={8}
                maxWidth={500}
            >
                <Column gap={12}>
                    <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                        {description}
                    </Paragraph>
                    {learnMoreUrl && <LearnMoreButton url={learnMoreUrl} />}
                </Column>
            </InfoItem>
            <Column alignItems={isContentBelowBreakpoint ? 'flex-start' : 'flex-end'} gap={8}>
                {children}
            </Column>
        </ContentFlex>
    );
};

const Details = () => {
    const { device, isLocked } = useDevice();
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const { isReceiveDisabled, ReceiveDisabledWrapper } = useReceiveDisabled();

    const dispatch = useDispatch();

    if (
        !device ||
        (selectedAccount.status !== 'loaded' && selectedAccount.status !== 'exception') ||
        selectedAccount.account == null
    ) {
        return <WalletLayout title="TR_ACCOUNT_DETAILS_HEADER" account={selectedAccount} />;
    }

    const { account } = selectedAccount;

    const locked = isLocked(true);
    const disabled = locked || isReceiveDisabled || selectedAccount.status !== 'loaded';

    const accountTypeTech = getAccountTypeTech(account.path);

    const isCoinjoinAccount = account.backendType === 'coinjoin';

    // xPub is required by networks using UTXO model. Bitcoin, Bitcoin Cash, Litecoin, Dogecoin, Cardano etc.
    const shouldDisplayXpubSection =
        account.networkType === 'bitcoin' || account.networkType === 'cardano';

    const handleXpubClick = () => dispatch(showXpub());

    return (
        <WalletLayout title="TR_ACCOUNT_DETAILS_HEADER" account={selectedAccount}>
            {isCoinjoinAccount && (
                <>
                    <Heading>
                        <Translation id="TR_COINJOIN_SETUP_HEADING" />
                    </Heading>
                    <CoinjoinSetup accountKey={account.key} />
                </>
            )}

            <Card data-testid="@wallet/account-details">
                <Column gap={40} hasDivider>
                    <DetailsRow
                        title="TR_ACCOUNT_DETAILS_TYPE_HEADER"
                        description={
                            <AccountTypeDescription
                                bip43Path={account.path}
                                accountType={account.accountType}
                                symbol={account.symbol}
                                networkType={account.networkType}
                            />
                        }
                    >
                        <AccountTypeBadge
                            accountType={account.accountType}
                            shouldDisplayNormalType
                            path={account.path}
                            networkType={account.networkType}
                        />
                        <Paragraph typographyStyle="body-xs" textWrap="nowrap">
                            (<Translation id={accountTypeTech} />)
                        </Paragraph>
                    </DetailsRow>
                    <DetailsRow
                        title="TR_ACCOUNT_DETAILS_PATH_HEADER"
                        description={<Translation id="TR_ACCOUNT_DETAILS_PATH_DESC" />}
                        learnMoreUrl={HELP_CENTER_BIP32_URL}
                    >
                        <Paragraph typographyStyle="body-sm">{account.path}</Paragraph>
                    </DetailsRow>
                    {!isCoinjoinAccount ? (
                        shouldDisplayXpubSection && (
                            <DetailsRow
                                title="TR_ACCOUNT_DETAILS_XPUB_HEADER"
                                description={<Translation id="TR_ACCOUNT_DETAILS_XPUB" />}
                                learnMoreUrl={HELP_CENTER_XPUB_URL}
                            >
                                <ReceiveDisabledWrapper>
                                    <Button
                                        intent="neutral"
                                        priority="secondary"
                                        data-testid="@wallets/details/show-xpub-button"
                                        onClick={handleXpubClick}
                                        isDisabled={disabled}
                                        isLoading={locked}
                                        minWidth={140}
                                    >
                                        <Translation id="TR_ACCOUNT_DETAILS_XPUB_BUTTON" />
                                    </Button>
                                </ReceiveDisabledWrapper>
                            </DetailsRow>
                        )
                    ) : (
                        <RescanAccount account={account} />
                    )}
                    {account.networkType === 'ethereum' && (
                        <DetailsRow
                            title="TR_ACCOUNT_DETAILS_NONCE_HEADER"
                            description={<Translation id="TR_ACCOUNT_DETAILS_NONCE_DESC" />}
                        >
                            <AccountNonce account={account} />
                        </DetailsRow>
                    )}
                    <Bip329Labels account={account} isLoading={locked} />
                </Column>
            </Card>

            {isCoinjoinAccount && <CoinjoinLogs />}
        </WalletLayout>
    );
};

export default Details;
