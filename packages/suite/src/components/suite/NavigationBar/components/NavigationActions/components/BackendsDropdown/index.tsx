import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { Dropdown, DropdownRef, CoinLogo, variables } from '@trezor/components';
import { Translation, StatusLight } from '@suite-components';
import ActionItem from '../ActionItem';
import { useActions, useSelector } from '@suite-hooks';
import { goto as gotoAction } from '@suite-actions/routerActions';
import { openModal as openModalAction } from '@suite-actions/modalActions';
import type { BackendType, BackendSettings } from '@wallet-reducers/settingsReducer';
import type { BlockchainState } from '@wallet-reducers/blockchainReducer';
import type { Network } from '@wallet-types';

const Wrapper = styled.div<{ marginLeft?: boolean }>`
    ${props => props.marginLeft && `margin-left: 8px;`}
    position: relative;
`;

const RowWrapper = styled.div`
    display: flex;
    width: 260px;
    align-items: center;
    > * + * {
        margin-left: 8px;
    }
    > div:nth-child(2) {
        flex: 1;
        display: flex;
        flex-direction: column;
        margin-left: 8px;
        overflow: hidden;
        > span:first-child {
            font-weight: ${variables.FONT_WEIGHT.MEDIUM};
            font-size: ${variables.FONT_SIZE.NORMAL};
            overflow: hidden;
            text-overflow: ellipsis;
        }
        > span:last-child {
            font-weight: ${variables.FONT_WEIGHT.MEDIUM};
            font-size: ${variables.FONT_SIZE.SMALL};
            color: ${props => props.theme.TYPE_LIGHT_GREY};
            text-transform: capitalize;
        }
    }
`;

const BackendRow = ({
    coin,
    type,
    blockchain,
}: {
    coin: Network['symbol'];
    type: BackendType;
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
            <StatusLight status={chain?.connected ? 'ok' : 'error'} />
        </RowWrapper>
    );
};

type BackendsDropdownProps = {
    marginLeft?: boolean;
};

const BackendsDropdown = ({ marginLeft }: BackendsDropdownProps) => {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<DropdownRef>();
    const { backends, blockchain } = useSelector(state => ({
        backends: state.wallet.settings.backends,
        blockchain: state.wallet.blockchain,
    }));
    const { goto, openModal } = useActions({
        goto: gotoAction,
        openModal: openModalAction,
    });

    const customBackends: BackendSettings[] = (
        Object.entries(backends) as Array<
            [Network['symbol'], NonNullable<typeof backends[Network['symbol']]>]
        >
    )
        .filter(([, { tor }]) => !tor)
        .map(([coin, settings]) => ({ coin, ...settings }));

    return (
        <Wrapper marginLeft={marginLeft}>
            <Dropdown
                onToggle={() => setOpen(!open)}
                ref={dropdownRef}
                alignMenu="right"
                offset={34}
                topPadding={0}
                minWidth={230}
                masterLink={{
                    callback: () => goto('settings-coins'),
                    label: <Translation id="TR_MANAGE" />,
                    icon: 'ARROW_RIGHT_LONG',
                }}
                items={[
                    {
                        key: 'backends',
                        label: <Translation id="TR_BACKENDS" />,
                        options: customBackends.map(({ coin, type }) => ({
                            key: coin,
                            label: <BackendRow coin={coin} type={type} blockchain={blockchain} />,
                            callback: () =>
                                openModal({
                                    type: 'advanced-coin-settings',
                                    coin,
                                }),
                        })),
                    },
                    {
                        key: 'note',
                        options: [
                            {
                                key: '1',
                                label: (
                                    <Translation
                                        id={
                                            customBackends.length
                                                ? 'TR_OTHER_COINS_USE_DEFAULT_BACKEND'
                                                : 'TR_ALL_COINS_USE_DEFAULT_BACKEND'
                                        }
                                    />
                                ),
                                noHover: true,
                                isDisabled: true,
                                separatorBefore: true,
                            },
                        ],
                    },
                ]}
            >
                <ActionItem
                    label={<Translation id="TR_BACKENDS" />}
                    icon="BACKEND"
                    isOpen={open}
                    indicator={customBackends.length ? 'check' : undefined}
                />
            </Dropdown>
        </Wrapper>
    );
};

export default BackendsDropdown;
