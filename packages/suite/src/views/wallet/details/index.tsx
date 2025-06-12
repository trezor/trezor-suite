import { ReactNode } from 'react';

import styled from 'styled-components';

import { getAccountTypeTech } from '@suite-common/wallet-utils';
import {
    Button,
    Card,
    Column,
    InfoItem,
    Paragraph,
    Row,
    Tooltip,
    variables,
} from '@trezor/components';
import { spacings } from '@trezor/theme';
import { HELP_CENTER_BIP32_URL, HELP_CENTER_XPUB_URL, Url } from '@trezor/urls';

import { showXpub } from 'src/actions/wallet/publicKeyActions';
import { Translation } from 'src/components/suite';
import { AccountTypeBadge } from 'src/components/suite/AccountTypeBadge';
import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';
import { TranslationKey } from 'src/components/suite/Translation';
import { AccountTypeDescription } from 'src/components/suite/modals/ReduxModal/UserContextModal/AddAccountModal/AccountTypeSelect/AccountTypeDescription';
import { WalletLayout } from 'src/components/wallet';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { selectIsFirmwareAuthenticityCheckEnabledAndHardFailed } from 'src/reducers/suite/suiteReducer';

import { CoinjoinLogs } from './CoinjoinLogs';
import { CoinjoinSetup } from './CoinjoinSetup/CoinjoinSetup';
import { RescanAccount } from './RescanAccount';

const Heading = styled.h3`
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    margin: 14px 0 4px;
    text-transform: uppercase;
`;

type DetailsRowProps = {
    title: TranslationKey;
    description: ReactNode;
    children: ReactNode;
    learnMoreUrl?: Url;
};

const DetailsRow = ({ title, description, learnMoreUrl, children }: DetailsRowProps) => (
    <Row gap={spacings.xxxl} justifyContent="space-between">
        <InfoItem
            label={<Translation id={title} />}
            typographyStyle="body"
            variant="default"
            gap={spacings.xs}
            maxWidth={500}
        >
            <Column gap={spacings.sm}>
                <Paragraph typographyStyle="hint" variant="tertiary">
                    {description}
                </Paragraph>
                {learnMoreUrl && <LearnMoreButton url={learnMoreUrl} />}
            </Column>
        </InfoItem>
        <Column alignItems="flex-end" gap={spacings.xs}>
            {children}
        </Column>
    </Row>
);

const Details = () => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const isAuthenticityCheckFailed = useSelector(
        selectIsFirmwareAuthenticityCheckEnabledAndHardFailed,
    );
    const dispatch = useDispatch();

    const tooltipContent = isAuthenticityCheckFailed ? (
        <Translation id="TR_RECEIVE_ADDRESS_SECURITY_CHECK_FAILED" />
    ) : null;

    const { device, isLocked } = useDevice();

    if (!device || selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_ACCOUNT_DETAILS_HEADER" account={selectedAccount} />;
    }

    const { account } = selectedAccount;
    const locked = isLocked(true);
    const disabled = locked || isAuthenticityCheckFailed;

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
                <Column gap={spacings.xxxl} hasDivider>
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
                            onElevation={true}
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
                                <Tooltip content={tooltipContent}>
                                    <Button
                                        variant="tertiary"
                                        data-testid="@wallets/details/show-xpub-button"
                                        onClick={handleXpubClick}
                                        isDisabled={disabled}
                                        isLoading={locked}
                                        size="small"
                                        minWidth={140}
                                    >
                                        <Translation id="TR_ACCOUNT_DETAILS_XPUB_BUTTON" />
                                    </Button>
                                </Tooltip>
                            </DetailsRow>
                        )
                    ) : (
                        <RescanAccount account={account} />
                    )}
                </Column>
            </Card>

            {isCoinjoinAccount && <CoinjoinLogs />}
        </WalletLayout>
    );
};

export default Details;
