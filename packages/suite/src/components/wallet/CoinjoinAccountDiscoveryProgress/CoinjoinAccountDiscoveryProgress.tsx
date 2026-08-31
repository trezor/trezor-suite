import { useMemo } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { useSelector } from '@suite-common/redux-utils';
import { localizeNumber } from '@suite-common/wallet-utils';
import { Card, Column, H3, Icon, LottieAnimation, ProgressBar } from '@trezor/components';
import { StarFourIcon } from '@trezor/icons';
import { typography } from '@trezor/theme';

import { useCoinjoinAccountLoadingProgress } from 'src/hooks/coinjoin';

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

const DiscoveryProgressWrapper = styled.div`
    width: 100%;
    max-width: 440px;
    margin: 20px 0 28px;
`;

const FactHeading = styled.div`
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.contentWarning};
    ${typography['body-xs']}
    text-transform: uppercase;
`;

const LottieWrapper = styled.div`
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
        <Card margin={{ bottom: 24 }}>
            <Column alignItems="center" margin={{ top: 24, bottom: 24 }}>
                <H3>
                    <Translation id="TR_LOADING_FUNDS" />
                </H3>
                <Subheader>
                    <LottieWrapper>
                        <LottieAnimation
                            type={stage === 'block' ? 'BLOCK' : 'MEMPOOL'}
                            size={64}
                            loop
                        />
                    </LottieWrapper>
                    {messageId && <Translation id={messageId} values={messageValues} />}
                </Subheader>

                <DiscoveryProgressWrapper>
                    <ProgressBar max={1.01} value={progress} />
                </DiscoveryProgressWrapper>

                <FactHeading>
                    <Icon
                        as={StarFourIcon}
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
