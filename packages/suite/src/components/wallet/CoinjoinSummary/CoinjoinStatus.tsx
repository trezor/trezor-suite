import React, { useMemo, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { Dropdown, GroupedMenuItems, Icon, Loader, useTheme, variables } from '@trezor/components';
import { CoinjoinSession } from '@suite-common/wallet-types';
import { Translation } from '@suite-components/Translation';
import { useActions } from '@suite-hooks/useActions';
import * as modalActions from '@suite-actions/modalActions';
import { CountdownTimer } from '@suite-components';

const Container = styled.div`
    position: relative;
    width: 160px;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-align: center;
`;

const SessionControlsMenu = styled(Dropdown)`
    position: absolute;
    top: -14px;
    right: -14px;
`;

const MenuLabel = styled.div`
    display: flex;
    align-items: center;

    > :first-child {
        margin-right: 12px;
    }
`;

const ProgressWheel = styled.div<{ progress: number; isPaused: boolean; isLoading: boolean }>`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 80px;
    height: 80px;
    margin-bottom: 10px;
    border-radius: 50%;
    background: ${({ theme, progress, isPaused }) =>
        `conic-gradient(${isPaused ? theme.TYPE_ORANGE : theme.BG_GREEN} ${3.6 * progress}deg, ${
            theme.STROKE_GREY
        } 0)`};
    transition: background 0.1s, opacity 0.05s;
    user-select: none;
    cursor: pointer;

    ${({ isLoading }) =>
        !isLoading &&
        css`
            :hover {
                > :first-child {
                    background: ${({ theme }) => theme.BG_GREY};
                }
            }

            :active {
                > :first-child {
                    background: #fafafa;
                }
            }
        `}
`;

const ProgressContent = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    width: calc(100% - 12px);
    height: calc(100% - 12px);
    background: ${({ theme }) => theme.BG_WHITE};
    border-radius: 50%;
    transition: background 0.1s;
`;

const StyledLoader = styled(Loader)`
    opacity: 0.7;
`;

const TimeLeft = styled.p`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.BIG};
`;

const iconBase = css`
    margin-bottom: 4px;
`;

const PlayIcon = styled(Icon)`
    ${iconBase}
    margin-left: 4px;
`;

const PauseIcon = styled(Icon)`
    ${iconBase};
`;

const PauseText = styled.p`
    height: 30px;
`;

enum MockCoinjoinPhase {
    Starting,
    Ongoing,
    Error,
}

const PHASE_TEXT = {
    [MockCoinjoinPhase.Starting]: 'Transaction signing starts in ',
    [MockCoinjoinPhase.Ongoing]: 'Next phase in ',
};

interface CoinjoinStatusProps {
    session: CoinjoinSession;
}

export const CoinjoinStatus = ({ session }: CoinjoinStatusProps) => {
    const [isPaused, setIsPaused] = useState(false); // temporary!
    const [isLoading, setIsLoading] = useState(false); // temporary!
    const [isWheelHovered, setIsWheelHovered] = useState(false);

    const { openModal } = useActions({
        openModal: modalActions.openModal,
    });

    const menuRef = useRef<HTMLUListElement & { close: () => void }>(null);
    const theme = useTheme();

    const timeLeft = `${(session.maxRounds - session.signedRounds.length) * 2.5}h`; // approximately 2.5h per round
    const progress = session.signedRounds.length / (session.maxRounds / 100);
    const phase = MockCoinjoinPhase.Starting;

    const togglePause = () => {
        setIsLoading(true);

        setTimeout(() => {
            // TEMPORARY
            setIsPaused(current => !current);
            setIsLoading(false);
        }, 1000);
    };

    const menuItems = useMemo<Array<GroupedMenuItems>>(
        () => [
            {
                key: 'coinjoin-actions',
                options: [
                    {
                        key: 'pause',
                        label: (
                            <MenuLabel>
                                <Icon icon="PAUSE" size={10} />
                                <Translation id="TR_PAUSE" />
                            </MenuLabel>
                        ),
                        callback: () => setIsPaused(current => !current),
                        'data-test': `@coinjoin/pause`,
                        isHidden: isPaused,
                    },
                    {
                        key: 'cancel',
                        label: (
                            <MenuLabel>
                                <Icon icon="CROSS" size={10} />
                                <Translation id="TR_CANCEL" />
                            </MenuLabel>
                        ),
                        callback: () => {
                            menuRef.current?.close();
                            openModal({ type: 'cancel-coinjoin' });
                        },
                        'data-test': `@coinjoin/cancel`,
                    },
                ],
            },
        ],
        [openModal, isPaused],
    );

    const iconConfig = {
        size: 18,
        color: theme.TYPE_DARK_GREY,
    };

    return (
        <Container>
            <SessionControlsMenu alignMenu="right" items={menuItems} ref={menuRef} />

            <ProgressWheel
                progress={progress}
                isPaused={isPaused}
                isLoading={isLoading}
                onClick={togglePause}
                onMouseEnter={() => setIsWheelHovered(true)}
                onMouseLeave={() => setIsWheelHovered(false)}
            >
                <ProgressContent>
                    {isLoading && <StyledLoader size={30} strokeWidth={3} />}

                    {/*  only show hours or fit min too? Or rounds left? */}
                    {!isLoading &&
                        (isPaused ? (
                            <>
                                {isWheelHovered ? (
                                    <>
                                        <PlayIcon icon="PLAY" {...iconConfig} />
                                        <Translation id="TR_RESUME" />
                                    </>
                                ) : (
                                    <>
                                        <PauseIcon icon="PAUSE" {...iconConfig} />
                                        <Translation id="TR_PAUSED" />
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                {isWheelHovered ? (
                                    <>
                                        <PauseIcon icon="PAUSE" {...iconConfig} />
                                        <Translation id="TR_PAUSE" />
                                    </>
                                ) : (
                                    <>
                                        <TimeLeft>{timeLeft}</TimeLeft>
                                        <p>
                                            <Translation id="TR_LEFT" />
                                        </p>
                                    </>
                                )}
                            </>
                        ))}
                </ProgressContent>
            </ProgressWheel>

            {isLoading && (
                <PauseText>
                    {isPaused ? <Translation id="TR_RESUMING" /> : <Translation id="TR_PAUSING" />}
                </PauseText>
            )}

            {!isLoading &&
                (isPaused ? (
                    <PauseText>
                        <Translation id="TR_COINJOIN_PAUSED" />
                    </PauseText>
                ) : (
                    <>
                        <p>{PHASE_TEXT[phase]}</p>
                        <p>
                            <CountdownTimer deadline={Number(session?.deadline)} />
                        </p>
                    </>
                ))}
        </Container>
    );
};
