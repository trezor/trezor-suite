import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { CSSTransition } from 'react-transition-group';

import { P, H1 } from '@trezor/components';
import { Loaders } from '@onboarding-components';

const ANIMATION_DURATION = 2.5;

const TRANSITION_PROPS = {
    classNames: 'fade-out',
    unmountOnExit: true,
};

const Logo = styled.svg`
    display: block;
    margin: 0 auto;
    width: 200px;
    height: 200px;
    opacity: 1;
    & .path {
        animation: animation ${ANIMATION_DURATION}s ease-in;
    }
    @keyframes animation {
        from {
            stroke-dasharray: 30 30;
        }
        to {
            stroke-dasharray: 30 0;
        }
    }
`;

const Loader = styled(P)`
    text-align: center;
`;

const PreloaderWrapper = styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;
    flex: 1;
    justify-content: center;
`;

interface Props {
    loaded: boolean;
    loadedTimeout?: number;
}

const Preloader: React.SFC<Props> = props => {
    const { loaded, loadedTimeout = 5000 } = props;
    const [introTimedout, setIntroTimedout] = useState(false);
    const [introExited, setIntroExited] = useState(false);

    useEffect(() => {
        let loadedTimeoutRef: number;

        // what shall happen if loading times out;
        if (!loaded) {
            loadedTimeoutRef = setTimeout(() => {
                setIntroTimedout(true);
            }, loadedTimeout);
        } else {
            setIntroTimedout(true);
        }
        return () => {
            clearTimeout(loadedTimeoutRef);
        };
    }, [loaded, loadedTimeout]);

    const preloaderFinished = loaded && introTimedout;

    return (
        <>
            <CSSTransition
                {...TRANSITION_PROPS}
                in={!preloaderFinished}
                timeout={1000}
                onExited={() => setIntroExited(true)}
            >
                <PreloaderWrapper>
                    <Logo viewBox="30 8 60 30" enableBackground="new 0 0 340 333">
                        <path
                            className="path"
                            fill="#FFFFFF"
                            stroke="#000000"
                            strokeWidth="0.4"
                            d="M70.3,14.2v-3.5c0-5.9-5-10.7-11.2-10.7c-6.2,0-11.2,4.8-11.2,10.7v3.5h-4.6v24.6h0l15.9,7.4l15.9-7.4h0V14.2H70.3z
                                M53.6,10.7c0-2.7,2.5-5,5.5-5c3,0,5.5,2.2,5.5,5v3.5H53.6V10.7z M68.6,34.7l-9.5,4.4l-9.5-4.4V20h19V34.7z"
                        />
                    </Logo>

                    <H1>
                        Welcome to Trezor
                        {/* <FormattedMessage {...l10nMessages.TR_WELCOME_TO_TREZOR} /> */}
                    </H1>

                    <Loader>
                        Loading
                        <Loaders.Dots maxCount={3} />
                    </Loader>
                </PreloaderWrapper>
            </CSSTransition>

            <CSSTransition in={introExited} timeout={1000} {...TRANSITION_PROPS}>
                <div style={{ width: '100%' }}>{props.children}</div>
            </CSSTransition>
        </>
    );
};

export default Preloader;
