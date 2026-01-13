import { ReactNode } from 'react';

import styled from 'styled-components';

import { Translation, TranslationKey } from '@suite/intl';
import { selectIsSuiteSyncEnabled } from '@suite-common/suite-sync';
import { selectDeviceAccountForNetworkSymbolAndAccountTypeWithIndex } from '@suite-common/wallet-core';
import { getAccountTypeTech } from '@suite-common/wallet-utils';
import { Button, Card, Column, InfoItem, Paragraph } from '@trezor/components';
import { typography } from '@trezor/theme';
import {
    HELP_CENTER_BIP329_URL,
    HELP_CENTER_BIP32_URL,
    HELP_CENTER_XPUB_URL,
    Url,
} from '@trezor/urls';

import { exportMetadataToBip329File } from 'src/actions/suite/metadataThunks';
import { showXpub } from 'src/actions/wallet/publicKeyActions';
import { AccountTypeBadge } from 'src/components/suite/AccountTypeBadge';
import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';
import { AccountTypeDescription } from 'src/components/suite/modals/ReduxModal/UserContextModal/AddAccountModal/AccountTypeSelect/AccountTypeDescription';
import { WalletLayout } from 'src/components/wallet';
import { useDefaultAccountLabel, useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { useLabelingCombined } from 'src/hooks/suite/useLabelingCombined';
import { useReceiveDisabled } from 'src/hooks/suite/useReceiveDisabled';

import { CoinjoinLogs } from './CoinjoinLogs';
import { CoinjoinSetup } from './CoinjoinSetup/CoinjoinSetup';
import { RescanAccount } from './RescanAccount';
import { ContentFlex, useIsContentBelowBreakpoint } from '../../../support/suite/ContentFlex';

const Heading = styled.h3`
    color: ${({ theme }) => theme.textSubdued};
    ${typography.callout}
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
                typographyStyle="body"
                variant="default"
                gap={8}
                maxWidth={500}
            >
                <Column gap={12}>
                    <Paragraph typographyStyle="hint" variant="tertiary">
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
    const { getDefaultAccountLabel } = useDefaultAccountLabel();
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const { params } = selectedAccount;
    const fallbackAccount = useSelector(state =>
        selectDeviceAccountForNetworkSymbolAndAccountTypeWithIndex(
            state,
            params?.symbol,
            params?.accountType,
            params?.accountIndex,
        ),
    );
    const isLocalFirstStorageEnabled = useSelector(selectIsSuiteSyncEnabled);

    const { isReceiveDisabled, ReceiveDisabledWrapper } = useReceiveDisabled();
    const { isMetadataEnabled } = useLabelingCombined({
        deviceStaticSessionId: device?.state?.staticSessionId,
    });

    const dispatch = useDispatch();

    if (
        !device ||
        (selectedAccount.status !== 'loaded' && selectedAccount.status !== 'exception') ||
        fallbackAccount == null
    ) {
        return <WalletLayout title="TR_ACCOUNT_DETAILS_HEADER" account={selectedAccount} />;
    }

    const account = selectedAccount.account ?? fallbackAccount;

    const locked = isLocked(true);
    const disabled = locked || isReceiveDisabled || !selectedAccount.account;

    const accountTypeTech = getAccountTypeTech(account.path);

    const isCoinjoinAccount = account.backendType === 'coinjoin';

    // xPub is required by networks using UTXO model. Bitcoin, Bitcoin Cash, Litecoin, Dogecoin, Cardano etc.
    const shouldDisplayXpubSection =
        account.networkType === 'bitcoin' || account.networkType === 'cardano';

    const shouldDisplayExportBip329Labels =
        account.networkType === 'bitcoin' && (isMetadataEnabled || isLocalFirstStorageEnabled);

    const handleXpubClick = () => dispatch(showXpub());

    const handleExportBip329 = () =>
        dispatch(exportMetadataToBip329File({ getDefaultAccountLabel }));

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
                        <Paragraph typographyStyle="label" textWrap="nowrap">
                            (<Translation id={accountTypeTech} />)
                        </Paragraph>
                    </DetailsRow>
                    <DetailsRow
                        title="TR_ACCOUNT_DETAILS_PATH_HEADER"
                        description={<Translation id="TR_ACCOUNT_DETAILS_PATH_DESC" />}
                        learnMoreUrl={HELP_CENTER_BIP32_URL}
                    >
                        <Paragraph typographyStyle="hint">{account.path}</Paragraph>
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
                    {shouldDisplayExportBip329Labels && (
                        <DetailsRow
                            title="TR_ACCOUNT_DETAILS_EXPORT_LABELS_HEADER"
                            description={
                                <Translation id="TR_ACCOUNT_DETAILS_EXPORT_LABELS_DESCRIPTION" />
                            }
                            learnMoreUrl={HELP_CENTER_BIP329_URL}
                        >
                            <Button
                                intent="neutral"
                                priority="secondary"
                                data-testid="@wallets/details/export-label-bip329"
                                onClick={handleExportBip329}
                                isLoading={locked}
                                minWidth={140}
                            >
                                <Translation id="TR_ACCOUNT_DETAILS_EXPORT_LABELS_BUTTON" />
                            </Button>
                        </DetailsRow>
                    )}
                </Column>
            </Card>

            {isCoinjoinAccount && <CoinjoinLogs />}
        </WalletLayout>
    );
};

export default Details;
