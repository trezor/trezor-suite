import { useMemo } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { localizeNumber } from '@suite-common/wallet-utils';
import { Card, Column, H3, Icon, LottieAnimation, ProgressBar } from '@trezor/components';
import { spacings, typography } from '@trezor/theme';

import { useCoinjoinAccountLoadingProgress } from 'src/hooks/coinjoin';
import { useSelector } from 'src/hooks/suite';

import { RotatingFacts } from './RotatingFacts';

const Subheader = styled.div`
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.contentSecondary};
    ${typography['body-sm']}
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
    color: ${({ theme }) => theme.contentWarning};
    ${typography['body-xs']}
    text-transform: uppercase;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledLottieAnimation = styled(LottieAnimation)`
    margin: -32px -8px -32px -20px;

    path {
        stroke: ${({ theme }) => theme.contentSecondary};
        fill: ${({ theme }) => theme.contentPrimaryInverse};
    }
`;

export const CoinjoinAccountDiscoveryProgress = () => {
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
                    <Icon
                        name="starFour"
                        size={13}
                        intent="warning"
                        margin={{ right: 4, bottom: 2 }}
                    />
                    <Translation id="TR_LOADING_FACT_TITLE" />
                </FactHeading>

                <RotatingFacts />
            </Column>
        </Card>
    );
};
