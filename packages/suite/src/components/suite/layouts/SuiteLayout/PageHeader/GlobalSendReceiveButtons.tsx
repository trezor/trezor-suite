import { useState } from 'react';
import { useIntl } from 'react-intl';

import styled from 'styled-components';

import { Account } from '@suite-common/wallet-types';
import { ButtonGroup, Input, Modal, Row, useScrollShadow } from '@trezor/components';
import { spacings, spacingsPx, zIndices } from '@trezor/theme';

import { AppNavigationTooltip } from 'src/components/suite/AppNavigation/AppNavigationTooltip';
import { Translation } from 'src/components/suite/Translation';
import { AddAccountModal } from 'src/components/suite/modals';
import { AccountsList } from 'src/components/wallet/WalletLayout/AccountsMenu/AccountsList';
import { AddAccountButton } from 'src/components/wallet/WalletLayout/AccountsMenu/AddAccountButton';
import { useDevice } from 'src/hooks/suite';
import { LocalAccountSearchProvider, useAccountSearch } from 'src/hooks/suite/useAccountSearch';
import { AccountItemType } from 'src/types/wallet';

import { HeaderActionButton } from './HeaderActionButton';
import { useGoToWithAnalytics } from './useGoToWithAnalytics';

const ScrollContainer = styled.div`
    height: auto;
    overflow: hidden auto;
`;

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    max-height: 550px;
    min-height: 550px;
    z-index: ${zIndices.expandableNavigationHeader};
    overflow: auto;
    gap: ${spacingsPx.sm};
`;

const GlobalSendReceiveModalBase = ({
    heading,
    onCancel,
    onSubmit,
    children,
}: {
    heading?: React.ReactNode;
    onCancel: () => void;
    onSubmit: (account: Account, type: AccountItemType) => void;
    children?: React.ReactNode;
}) => {
    const { searchString, setSearchString } = useAccountSearch();
    const intl = useIntl();
    const { scrollElementRef, onScroll, ShadowTop, ShadowBottom, ShadowContainer } =
        useScrollShadow();

    return (
        <Modal heading={heading} onCancel={onCancel} size="small">
            <Wrapper>
                <Row gap={spacings.xs}>
                    <Input
                        placeholder={intl.formatMessage({
                            defaultMessage: 'Search',
                            id: 'TR_SEARCH',
                        })}
                        size="small"
                        value={searchString}
                        onChange={event => setSearchString(event.target.value)}
                    />
                    {children ?? null}
                </Row>
                <ShadowContainer>
                    <ShadowTop backgroundColor="backgroundSurfaceElevationNegative" />
                    <ScrollContainer ref={scrollElementRef} onScroll={onScroll}>
                        <AccountsList forceOnlyItemClick onItemClick={onSubmit} />
                    </ScrollContainer>
                    <ShadowBottom backgroundColor="backgroundSurfaceElevationNegative" />
                </ShadowContainer>
            </Wrapper>
        </Modal>
    );
};

const GlobalReceiveModal = ({
    onCancel,
    onSubmit,
}: {
    onCancel: () => void;
    onSubmit: (account: Account, type: AccountItemType) => void;
}) => {
    const { device } = useDevice();
    const [addAccountModalOpen, setAddAccountModalOpen] = useState(false);

    return (
        <LocalAccountSearchProvider>
            <GlobalSendReceiveModalBase
                heading={<Translation id="TR_RECEIVE" />}
                onCancel={onCancel}
                onSubmit={onSubmit}
            >
                <AddAccountButton
                    isFullWidth
                    maxWidth={150}
                    data-testid="@global-send-receive/add-account"
                    device={device}
                    customModalOpen={() => {
                        setAddAccountModalOpen(true);
                    }}
                />
                {addAccountModalOpen && device && (
                    <AddAccountModal
                        noRedirect
                        device={device}
                        onCancel={() => setAddAccountModalOpen(false)}
                        onAddAccount={account => {
                            onSubmit(account, 'coin');
                        }}
                    />
                )}
            </GlobalSendReceiveModalBase>
        </LocalAccountSearchProvider>
    );
};

const GlobalSendModal = ({
    onCancel,
    onSubmit,
}: {
    onCancel: () => void;
    onSubmit: (account: Account, type: AccountItemType) => void;
}) => (
    <LocalAccountSearchProvider>
        <GlobalSendReceiveModalBase
            heading={<Translation id="SEND_TRANSACTION" />}
            onCancel={onCancel}
            onSubmit={onSubmit}
        />
    </LocalAccountSearchProvider>
);

export const GlobalSendReceiveButtons = () => {
    const { device } = useDevice();
    const goToWithAnalytics = useGoToWithAnalytics();
    const buttonVariant = device?.connected && device?.available ? 'primary' : 'tertiary';
    const [isSendModalOpen, setIsSendModalOpen] = useState(false);
    const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);

    return (
        <AppNavigationTooltip>
            <ButtonGroup size="small">
                <HeaderActionButton
                    key="wallet-send"
                    icon="arrowUp"
                    onClick={() => {
                        setIsSendModalOpen(true);
                    }}
                    data-testid="@wallet/menu/wallet-global-send"
                    variant={buttonVariant}
                >
                    <Translation id="TR_NAV_SEND" />
                </HeaderActionButton>

                <HeaderActionButton
                    key="wallet-receive"
                    icon="arrowDown"
                    onClick={() => {
                        setIsReceiveModalOpen(true);
                    }}
                    data-testid="@wallet/menu/wallet-global-receive"
                    variant={buttonVariant}
                >
                    <Translation id="TR_NAV_RECEIVE" />
                </HeaderActionButton>
            </ButtonGroup>
            {isSendModalOpen && (
                <GlobalSendModal
                    onCancel={() => setIsSendModalOpen(false)}
                    onSubmit={account => {
                        setIsSendModalOpen(false);
                        goToWithAnalytics('wallet-send', {
                            params: {
                                symbol: account.symbol,
                                accountIndex: account.index,
                                accountType: account.accountType,
                            },
                        });
                    }}
                />
            )}
            {isReceiveModalOpen && (
                <GlobalReceiveModal
                    onCancel={() => setIsReceiveModalOpen(false)}
                    onSubmit={account => {
                        setIsReceiveModalOpen(false);
                        goToWithAnalytics('wallet-receive', {
                            params: {
                                symbol: account.symbol,
                                accountIndex: account.index,
                                accountType: account.accountType,
                            },
                        });
                    }}
                />
            )}
        </AppNavigationTooltip>
    );
};
