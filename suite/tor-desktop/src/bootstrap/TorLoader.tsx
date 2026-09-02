import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { selectIsTorError, selectTorBootstrap, torActions } from '@suite/tor';
import { TorStatus } from '@suite/tor-types';
import { useDispatch } from '@suite-common/redux-utils';
import {
    Banner,
    Card,
    Column,
    H3,
    Modal,
    Paragraph,
    ProgressBar,
    Row,
    Text,
} from '@trezor/components';
import { ClockClockwiseIcon, RepeatIcon, TorBrowserIcon } from '@trezor/icons';

import { toggleTorThunk } from '../toggleTorThunk';

type TorLoaderProps = {
    callback: (value: boolean) => void;
};

export const TorLoader = ({ callback }: TorLoaderProps) => {
    const [progress, setProgress] = useState<number>(0);
    // We create a local `isDisabling` flag to make the fake disabling,
    // since if we use Tor state, the information is real about the Tor state
    // and we want to show user the fake loading feedback.
    const [isDisabling, setIsDisabling] = useState<boolean>(false);
    const torBootstrap = useSelector(selectTorBootstrap);
    const isTorError = useSelector(selectIsTorError);
    const dispatch = useDispatch();

    useEffect(() => {
        // When Tor is disabling there might still be some bootstrap event coming but
        // we will ignore them since when disabling started there is no way back in this component
        // We only relay on fakeProgress when disabling.
        if (isDisabling) {
            return;
        }
        if (progress === 100) {
            setProgress(0);
        }
        if (torBootstrap?.current) {
            setProgress(torBootstrap.current);
            if (torBootstrap.current === torBootstrap.total) {
                dispatch(torActions.setTorStatus(TorStatus.Enabled));
                callback(true);
            }
        }
    }, [dispatch, progress, torBootstrap, callback, isDisabling]);

    const tryAgain = async () => {
        setProgress(0);
        dispatch(torActions.setTorStatus(TorStatus.Enabling));

        try {
            await dispatch(toggleTorThunk(true));
        } catch {
            dispatch(torActions.setTorStatus(TorStatus.Error));
        }
    };

    const disableTor = async () => {
        setIsDisabling(true);
        let fakeProgress = 0;
        // We do not wait until toggleTor is done since we want to display fake progress.
        // Errors are swallowed on purpose so the fake disabling progress always completes.
        void dispatch(toggleTorThunk(false)).catch(() => {});

        // This is a total fake progress, otherwise it would be too fast for user.
        await new Promise(resolve => {
            const interval = setInterval(() => {
                if (fakeProgress === 100) {
                    clearInterval(interval);

                    return resolve(null);
                }

                fakeProgress += 10;
                setProgress(fakeProgress);
            }, 300);
        });

        callback(false);
    };

    const getMessageId = () => {
        if (isTorError) {
            return 'TR_ENABLING_TOR_FAILED';
        }
        if (isDisabling) {
            return 'TR_DISABLING_TOR';
        }

        return 'TR_ENABLING_TOR';
    };

    return (
        <Modal
            intent="info"
            icon={TorBrowserIcon}
            width={600}
            bottomContent={
                <>
                    {!isDisabling && (
                        <Modal.Button
                            data-testid="@tor-loading-screen/disable-button"
                            intent="neutral"
                            priority="secondary"
                            onClick={disableTor}
                        >
                            <Translation id="TR_TOR_DISABLE" />
                        </Modal.Button>
                    )}
                    {isTorError && (
                        <Modal.Button
                            data-testid="@tor-loading-screen/try-again-button"
                            iconLeft={RepeatIcon}
                            onClick={tryAgain}
                            intent="neutral"
                            priority="secondary"
                        >
                            <Translation id="TR_TRY_AGAIN" />
                        </Modal.Button>
                    )}
                </>
            }
        >
            <Column gap={16}>
                <H3>
                    <Translation id={getMessageId()} />
                </H3>
                <Card type="contrast">
                    <Row gap={16}>
                        <ProgressBar value={isTorError ? 100 : progress} />
                        <Paragraph
                            intent="neutral"
                            priority="secondary"
                            typographyStyle="body-md"
                            textWrap="nowrap"
                        >
                            {isTorError ? (
                                <Translation id="TR_FAILED" />
                            ) : (
                                <Text>{progress} %</Text>
                            )}
                        </Paragraph>
                    </Row>
                </Card>
                {!!torBootstrap?.isSlow && (
                    <Banner
                        intent="info"
                        icon={ClockClockwiseIcon}
                        description={
                            <Translation id="TR_TOR_IS_SLOW_MESSAGE" values={{ br: () => ' ' }} />
                        }
                    />
                )}
            </Column>
        </Modal>
    );
};
