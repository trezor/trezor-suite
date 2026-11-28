import { useState } from 'react';

import { Translation, useTranslation } from '@suite/intl';
import { type Account } from '@suite-common/wallet-types';
import { Box, Button, IconButton } from '@trezor/components';
import { InfoIcon } from '@trezor/icons';
import { TokenIcon } from '@trezor/product-components';

import { useLayoutSize } from '#src/hooks/suite/useLayoutSize';

import { LidoStakingInfoModal } from './LidoStakingInfoModal';
import { useLidoBackNavigation } from './useLidoBackNavigation';
import { EarnAccountPageHeader } from '../../common/EarnAccountPageHeader';

type LidoStakePageHeaderProps = {
    account?: Account;
};

export const LidoStakePageHeader = ({ account }: LidoStakePageHeaderProps) => {
    const onBack = useLidoBackNavigation(account);
    const { isBelowMobile } = useLayoutSize();
    const { translationString } = useTranslation();
    const [isInfoOpen, setIsInfoOpen] = useState(false);

    return (
        <>
            <EarnAccountPageHeader
                title={<Translation id="TR_EARN_LIDO_PAGE_TITLE" />}
                account={account}
                tokenIcon={
                    account && (
                        <TokenIcon
                            networkSymbol={account.symbol}
                            showNetworkIcon
                            size={32}
                            isBordered={false}
                            wrappedTokenIcon="network"
                        />
                    )
                }
                balanceFormat="exact"
                expandable
                onBack={onBack}
                balanceTestId="@staking/lido-header/balance"
                actions={
                    account && (
                        <Box margin={{ left: 'auto' }}>
                            {isBelowMobile ? (
                                <IconButton
                                    icon={InfoIcon}
                                    intent="neutral"
                                    priority="secondary"
                                    size="large"
                                    aria-label={translationString('TR_LEARN_MORE')}
                                    tooltip={{ content: <Translation id="TR_LEARN_MORE" /> }}
                                    data-testid="@staking/lido-header/learn-more"
                                    onClick={() => setIsInfoOpen(true)}
                                />
                            ) : (
                                <Button
                                    intent="neutral"
                                    priority="secondary"
                                    data-testid="@staking/lido-header/learn-more"
                                    onClick={() => setIsInfoOpen(true)}
                                >
                                    <Translation id="TR_LEARN_MORE" />
                                </Button>
                            )}
                        </Box>
                    )
                }
            />

            {isInfoOpen && account && (
                <LidoStakingInfoModal account={account} onClose={() => setIsInfoOpen(false)} />
            )}
        </>
    );
};
