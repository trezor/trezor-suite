import { useState, useEffect, ComponentType } from 'react';

import styled from 'styled-components';
import { TorStatus } from 'src/types/suite';

import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectTorState } from 'src/reducers/suite/suiteReducer';
import { toggleTor, updateTorStatus } from 'src/actions/suite/suiteActions';

import { Button, ModalProps } from '@trezor/components';
import { TorProgressBar } from './TorProgressBar';

const StyledButton = styled(Button)`
    width: 150px;
`;

interface TorLoadingScreenProps {
    ModalWrapper: ComponentType<ModalProps>;
    callback: (value: boolean) => void;
}

export const TorLoader = ({ callback, ModalWrapper }: TorLoadingScreenProps) => {
    const [progress, setProgress] = useState<number>(0);
    // We create a local `isDisabling` flag to make the fake disabling,
    // since if we use Tor state, the information is real about the Tor state
    // and we want to show user the fake loading feedback.
    const [isDisabling, setIsDisabling] = useState<boolean>(false);
    const { torBootstrap, isTorError } = useSelector(selectTorState);

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
            await dispatch(toggleTor(true));
        } catch {
            dispatch(updateTorStatus(TorStatus.Error));
        }
    };

    const disableTor = async () => {
        setIsDisabling(true);
        let fakeProgress = 0;
        // We do not wait until toggleTor is done since we want to display fake progress.
        dispatch(toggleTor(false));

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

    return (
        <ModalWrapper
            bottomBarComponents={
                isTorError && (
                    <StyledButton
                        data-test="@tor-loading-screen/try-again-button"
                        icon="REFRESH"
                        onClick={tryAgain}
                    >
                        <Translation id="TR_TRY_AGAIN" />
                    </StyledButton>
                )
            }
        >
            <TorProgressBar
                isTorError={isTorError}
                isTorDisabling={isDisabling}
                isTorBootstrapSlow={!!torBootstrap?.isSlow}
                progress={progress}
                disableTor={disableTor}
            />
        </ModalWrapper>
    );
};
