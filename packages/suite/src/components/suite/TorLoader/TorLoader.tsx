import { ComponentType, ReactNode, useEffect, useState } from 'react';

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
import { spacings } from '@trezor/theme';

import { toggleTor, updateTorStatus } from 'src/actions/suite/suiteActions';
import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectModalType } from 'src/reducers/suite/modalReducer';
import { selectTorState } from 'src/reducers/suite/suiteReducer';
import { TorStatus } from 'src/types/suite';

type TorLoadingScreenProps = {
    ModalWrapper?: ComponentType<{ children: ReactNode }>;
    callback: (value: boolean) => void;
};

export const TorLoader = ({ callback }: TorLoadingScreenProps) => {
    const [progress, setProgress] = useState<number>(0);
    // We create a local `isDisabling` flag to make the fake disabling,
    // since if we use Tor state, the information is real about the Tor state
    // and we want to show user the fake loading feedback.
    const [isDisabling, setIsDisabling] = useState<boolean>(false);
    const { torBootstrap, isTorError } = useSelector(selectTorState);
    const modalType = useSelector(selectModalType);

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
        if (torBootstrap && torBootstrap.current) {
            setProgress(torBootstrap.current);
            if (torBootstrap.current === torBootstrap.total) {
                dispatch(updateTorStatus(TorStatus.Enabled));
                callback(true);
            }
        }
    }, [dispatch, progress, torBootstrap, callback, isDisabling]);

    const tryAgain = async () => {
        setProgress(0);
        dispatch(updateTorStatus(TorStatus.Enabling));

        try {
            await dispatch(toggleTor(true, modalType));
        } catch {
            dispatch(updateTorStatus(TorStatus.Error));
        }
    };

    const disableTor = async () => {
        setIsDisabling(true);
        let fakeProgress = 0;
        // We do not wait until toggleTor is done since we want to display fake progress.
        dispatch(toggleTor(false, modalType));

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
            variant="info"
            iconName="torBrowser"
            size="small"
            bottomContent={
                <>
                    {!isDisabling && (
                        <Modal.Button
                            data-testid="@tor-loading-screen/disable-button"
                            variant="tertiary"
                            onClick={disableTor}
                        >
                            <Translation id="TR_TOR_DISABLE" />
                        </Modal.Button>
                    )}
                    {isTorError && (
                        <Modal.Button
                            data-testid="@tor-loading-screen/try-again-button"
                            icon="repeat"
                            onClick={tryAgain}
                            variant="tertiary"
                        >
                            <Translation id="TR_TRY_AGAIN" />
                        </Modal.Button>
                    )}
                </>
            }
        >
            <Column gap={spacings.md}>
                <H3>
                    <Translation id={getMessageId()} />
                </H3>
                <Card fillType="flat">
                    <Row gap={spacings.md}>
                        <ProgressBar value={isTorError ? 100 : progress} />
                        <Paragraph variant="tertiary" typographyStyle="body" textWrap="nowrap">
                            {isTorError ? (
                                <Translation id="TR_FAILED" />
                            ) : (
                                <Text>{progress} %</Text>
                            )}
                        </Paragraph>
                    </Row>
                </Card>
                {!!torBootstrap?.isSlow && (
                    <Banner variant="info" icon="clockClockwise">
                        <Translation id="TR_TOR_IS_SLOW_MESSAGE" values={{ br: () => ' ' }} />
                    </Banner>
                )}
            </Column>
        </Modal>
    );
};
