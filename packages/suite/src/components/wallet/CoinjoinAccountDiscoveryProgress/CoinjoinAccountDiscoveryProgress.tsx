import { useMemo } from 'react';
import styled, { useTheme } from 'styled-components';

import {
    Card,
    Column,
    H3,
    Icon,
    LottieAnimation,
    ProgressBar,
    variables,
} from '@trezor/components';
import { localizeNumber } from '@suite-common/wallet-utils';
import { Translation } from 'src/components/suite';
import { useCoinjoinAccountLoadingProgress } from 'src/hooks/coinjoin';
import { RotatingFacts } from './RotatingFacts';
import { useSelector } from 'src/hooks/suite';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';
import { spacings } from '@trezor/theme';

const Subheader = styled.div`
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    text-align: center;
    margin-top: 8px;

    &:empty::before {
        content: '\\200b'; /* zero-width space to preserve the height of empty div */
    }
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const DiscoveryProgress = styled(ProgressBar)`
    max-width: 440px;
    margin: 18px 0 28px;

    ${ProgressBar.Value} {
        transition: width 30s cubic-bezier(0.3, 1, 0.3, 1);
    }
`;

const FactHeading = styled.div`
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.legacy.TYPE_ORANGE};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-transform: uppercase;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const SparksIcon = styled(Icon)`
    margin-right: 4px;
    padding-bottom: 2px;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledLottieAnimation = styled(LottieAnimation)`
    margin: -32px -8px -32px -20px;

    path {
        stroke: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
        fill: ${({ theme }) => theme.legacy.BG_WHITE};
    }
`;

export const CoinjoinAccountDiscoveryProgress = () => {
    const theme = useTheme();
    const locale = useSelector(selectLanguage);
    const { messageId, outOf, progress, stage } = useCoinjoinAccountLoadingProgress();
    const messageValues = useMemo(
        () =>
            outOf && {
                current: localizeNumber(outOf.current, locale),
                total: localizeNumber(outOf.total, locale),
            },
        [outOf, locale],
    );

    return (
        <Card margin={{ bottom: spacings.xl }}>
            <Column alignItems="center" margin={{ top: spacings.xl, bottom: spacings.xl }}>
                <H3>
                    <Translation id="TR_LOADING_FUNDS" />
                </H3>
                <Subheader>
                    <StyledLottieAnimation
                        type={stage === 'block' ? 'BLOCK' : 'MEMPOOL'}
                        size={64}
                        loop
                    />
                    {messageId && <Translation id={messageId} values={messageValues} />}
                </Subheader>

                <DiscoveryProgress max={1.01} value={progress} />

                <FactHeading>
                    <SparksIcon name="experimental" size={13} color={theme.legacy.TYPE_ORANGE} />
                    <Translation id="TR_LOADING_FACT_TITLE" />
                </FactHeading>

                <RotatingFacts />
            </Column>
        </Card>
    );
};
