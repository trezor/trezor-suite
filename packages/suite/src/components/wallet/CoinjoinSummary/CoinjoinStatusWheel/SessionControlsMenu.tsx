import React, { useMemo, useRef } from 'react';
import styled from 'styled-components';
import { Dropdown, FluidSpinner, GroupedMenuItems, Icon } from '@trezor/components';
import { Translation } from 'src/components/suite/Translation';
import { stopCoinjoinSession } from 'src/actions/wallet/coinjoinAccountActions';
import { useCoinjoinSessionBlockers } from 'src/hooks/coinjoin/useCoinjoinSessionBlockers';
import { useDispatch } from 'src/hooks/suite/useDispatch';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectCurrentCoinjoinWheelStates } from 'src/reducers/wallet/coinjoinReducer';

const Menu = styled(Dropdown)`
    position: absolute;
    top: 6px;
    right: 8px;
`;

const MenuLabel = styled.div`
    display: flex;
    align-items: center;

    > :first-child {
        margin-right: 12px;
    }
`;

const CrossIcon = styled(Icon)`
    width: 10px;
    height: 10px;
`;

interface SessionControlsMenu {
    accountKey: string;
    togglePause: () => void;
}

export const SessionControlsMenu = ({ accountKey, togglePause }: SessionControlsMenu) => {
    const { isPaused, isLoading } = useSelector(selectCurrentCoinjoinWheelStates);

    const { isCoinjoinSessionBlocked } = useCoinjoinSessionBlockers(accountKey);

    const menuRef = useRef<HTMLUListElement & { close: () => void }>(null);
    const dispatch = useDispatch();

    const menuItems = useMemo<Array<GroupedMenuItems>>(
        () => [
            {
                key: 'coinjoin-actions',
                options: [
                    {
                        key: 'resume',
                        label: (
                            <MenuLabel>
                                <Icon icon="PLAY" size={10} />
                                <Translation id="TR_RESUME" />
                            </MenuLabel>
                        ),
                        callback: togglePause,
                        'data-test': `@coinjoin/resume`,
                        isHidden: !isPaused || isLoading || isCoinjoinSessionBlocked,
                    },
                    {
                        key: 'resuming',
                        label: (
                            <MenuLabel>
                                <FluidSpinner size={10} />
                                <Translation id="TR_RESUMING" />
                            </MenuLabel>
                        ),
                        isHidden: !isLoading,
                        isDisabled: true,
                    },
                    {
                        key: 'pause',
                        label: (
                            <MenuLabel>
                                <Icon icon="PAUSE" size={10} />
                                <Translation id="TR_PAUSE" />
                            </MenuLabel>
                        ),
                        callback: togglePause,
                        'data-test': `@coinjoin/pause`,
                        isHidden: isPaused,
                    },
                    {
                        key: 'cancel',
                        label: (
                            <MenuLabel>
                                <CrossIcon icon="CROSS" size={14} />
                                <Translation id="TR_CANCEL" />
                            </MenuLabel>
                        ),
                        callback: () => {
                            menuRef.current?.close();
                            dispatch(stopCoinjoinSession(accountKey));
                        },
                        'data-test': `@coinjoin/cancel`,
                    },
                ],
            },
        ],
        [accountKey, dispatch, isCoinjoinSessionBlocked, isLoading, isPaused, togglePause],
    );

    return <Menu alignMenu="right" items={menuItems} ref={menuRef} />;
};
