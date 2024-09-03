import React, { ReactNode, useRef, useState } from 'react';
import styled from 'styled-components';

import { Dropdown, DropdownRef, CoinLogo } from '@trezor/components';
import { Translation, StatusLight } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { BlockchainState } from '@suite-common/wallet-core';
import type { CustomBackend } from 'src/types/wallet';
import { openModal } from 'src/actions/suite/modalActions';
import { spacingsPx, typography } from '@trezor/theme';

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledDropdown = styled(Dropdown)`
    display: block;
    width: 100%;
`;

const RowWrapper = styled.div`
    display: flex;
    width: 260px;
    align-items: center;

    > * + * {
        margin-left: ${spacingsPx.xs};
    }

    > div:nth-child(2) {
        flex: 1;
        display: flex;
        flex-direction: column;
        margin-left: ${spacingsPx.xs};
        overflow: hidden;

        > span:first-child {
            ${typography.body}
            overflow: hidden;
            text-overflow: ellipsis;
        }

        > span:last-child {
            ${typography.hint}
            color: ${({ theme }) => theme.textSubdued};
            text-transform: capitalize;
        }
    }
`;

const BackendRow = ({
    backend: { coin, type },
    blockchain,
}: {
    backend: CustomBackend;
    blockchain: BlockchainState;
}) => {
    const chain = blockchain[coin];

    return (
        <RowWrapper>
            <CoinLogo symbol={coin} />
            <div>
                {chain?.url ? (
                    <span>{chain.url}</span>
                ) : (
                    <Translation id="TR_BACKEND_DISCONNECTED" />
                )}
                <span>{type}</span>
            </div>
            <StatusLight variant={chain?.connected ? 'primary' : 'destructive'} />
        </RowWrapper>
    );
};

const DefaultBackendsLabel = styled.div`
    white-space: normal;
`;

type NavBackendsProps = {
    customBackends: CustomBackend[];
    children: ReactNode;
};

export const NavBackends = ({ customBackends, children }: NavBackendsProps) => {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<DropdownRef>();
    const blockchain = useSelector(state => state.wallet.blockchain);
    const dispatch = useDispatch();

    const goToCoinsSettings = () => dispatch(goto('settings-coins'));
    const items = [
        {
            key: 'backends',
            label: <Translation id="TR_BACKENDS" />,
            options: customBackends.map(backend => ({
                key: backend.coin,
                label: <BackendRow backend={backend} blockchain={blockchain} />,
                onClick: () =>
                    dispatch(
                        openModal({
                            type: 'advanced-coin-settings',
                            coin: backend.coin,
                        }),
                    ),
            })),
        },
        {
            key: 'note',
            options: [
                {
                    key: '1',
                    label: (
                        <DefaultBackendsLabel>
                            <Translation id="TR_OTHER_COINS_USE_DEFAULT_BACKEND" />
                        </DefaultBackendsLabel>
                    ),
                    isDisabled: true,
                    separatorBefore: true,
                },
            ],
        },
    ];

    return (
        <StyledDropdown
            onToggle={() => setOpen(!open)}
            ref={dropdownRef}
            alignMenu="top-right"
            addon={{
                onClick: goToCoinsSettings,
                label: <Translation id="TR_MANAGE" />,
                icon: 'arrowRightLong',
            }}
            items={items}
        >
            {/* The must be div so Dropdown works. Its mess, Dropdown shall be reworked.*/}
            <div>{children}</div>
        </StyledDropdown>
    );
};
