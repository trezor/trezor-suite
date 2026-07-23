import { Translation, type TranslationKey } from '@suite/intl';
import { type Account } from '@suite-common/wallet-types';
import { IconButton, Row, Text } from '@trezor/components';
import { CaretLeftIcon } from '@trezor/icons';
import { TokenIcon } from '@trezor/product-components';

import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';

import { useNavigateToAccountRoute } from './useNavigateToAccountRoute';

type WrappedNativePageHeaderProps = {
    titleId: TranslationKey;
    account?: Account;
    contractAddress?: string;
};

export const WrappedNativePageHeader = ({
    titleId,
    account,
    contractAddress,
}: WrappedNativePageHeaderProps) => {
    const navigateToTokenOverview = useNavigateToAccountRoute(account, 'wallet-tokens');

    return (
        <PageHeader expandable>
            <Row width="100%" gap={16} alignItems="center">
                <IconButton
                    icon={CaretLeftIcon}
                    intent="neutral"
                    priority="secondary"
                    size="large"
                    onClick={navigateToTokenOverview}
                    isDisabled={!account}
                    data-testid="@account-subpage/back"
                    tooltip={{ content: <Translation id="TR_BACK" /> }}
                />

                <Row alignItems="center" gap={12}>
                    {account && (
                        <TokenIcon
                            symbol={account.symbol}
                            contractAddress={contractAddress}
                            showNetworkIcon
                            size={32}
                            isBordered={false}
                        />
                    )}
                    <Text typographyStyle="body-md-strong">
                        <Translation id={titleId} />
                    </Text>
                </Row>
            </Row>
        </PageHeader>
    );
};
