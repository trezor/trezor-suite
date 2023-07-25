import React, { useEffect, useState, useMemo } from 'react';
import styled, { useTheme } from 'styled-components';
import Lottie from 'lottie-react';

import { H3, Icon, Progress, variables } from '@trezor/components';
import { localizeNumber } from '@suite-common/wallet-utils';
import { Card, Translation } from 'src/components/suite';
import { useAccountLoadingProgress } from './useAccountLoadingProgress';
import { RotatingFacts } from './RotatingFacts';
import { useSelector } from 'src/hooks/suite';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';

const Container = styled(Card)`
    flex-direction: column;
    align-items: center;
    padding-top: 36px;
    padding-bottom: 36px;
    margin-bottom: 24px;
`;

const Subheader = styled.div`
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    text-align: center;
    margin-top: 8px;
    :empty:before {
        content: '\\200b'; /* zero-width space to preserve the height of empty div */
    }
`;

const DiscoveryProgress = styled(Progress)`
    max-width: 440px;
    margin: 18px 0 28px;

    ${Progress.Value} {
        transition: width 30s cubic-bezier(0.3, 1, 0.3, 1);
    }
`;

const FactHeading = styled.div`
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.TYPE_ORANGE};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-transform: uppercase;
`;

const SparksIcon = styled(Icon)`
    margin-right: 4px;
    padding-bottom: 2px;
`;

const BlocksLottie = styled(Lottie)`
    width: 64px;
    height: 64px;
    margin: -32px -8px -32px -20px;

    path {
        stroke: ${({ theme }) => theme.TYPE_LIGHT_GREY};
        fill: ${({ theme }) => theme.BG_WHITE};
    }
`;

const useAnimationData = (stage?: 'block' | 'mempool') => {
    const [animationData, setAnimationData] = useState<unknown>();

    useEffect(() => {
        let mounted = true;
        if (!stage) setAnimationData(undefined);
        else {
            import(`./lottie/${stage === 'block' ? 'cubes_line' : 'square_stack'}.json`).then(
                data => {
                    if (mounted) {
                        setAnimationData(data);
                    }
                },
            );
        }
        return () => {
            mounted = false;
        };
    }, [stage]);

    return animationData;
};

export const CoinjoinAccountDiscoveryProgress = () => {
    const theme = useTheme();
    const locale = useSelector(selectLanguage);
    const { messageId, outOf, progress, stage } = useAccountLoadingProgress();
    const animationData = useAnimationData(stage);
    const messageValues = useMemo(
        () =>
            outOf && {
                current: localizeNumber(outOf.current, locale),
                total: localizeNumber(outOf.total, locale),
            },
        [outOf, locale],
    );

    return (
        <Container>
            <H3>
                <Translation id="TR_LOADING_FUNDS" />
            </H3>
            <Subheader>
                {!!animationData && <BlocksLottie animationData={animationData} loop />}
                {messageId && <Translation id={messageId} values={messageValues} />}
            </Subheader>

            <DiscoveryProgress max={1.01} value={progress} />

            <FactHeading>
                <SparksIcon icon="EXPERIMENTAL" size={13} color={theme.TYPE_ORANGE} />
                <Translation id="TR_LOADING_FACT_TITLE" />
            </FactHeading>

            <RotatingFacts />
        </Container>
    );
};
