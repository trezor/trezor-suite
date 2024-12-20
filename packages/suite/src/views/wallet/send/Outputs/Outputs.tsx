import { useEffect, useRef, useState } from 'react';

import styled from 'styled-components';
import { motion } from 'framer-motion';

import { Card, motionEasing, Column } from '@trezor/components';
import { motionEasingStrings } from '@trezor/components/src/config/motion';
import { spacings } from '@trezor/theme';
import { getNetworkFeatures } from '@suite-common/wallet-config';

import { useSendFormContext } from 'src/hooks/wallet';

import { Address } from './Address';
import { Amount } from './Amount/Amount';
import { OpReturn } from './OpReturn';
import { TokenSelect } from './TokenSelect/TokenSelect';

const Container = styled.div<{ $height: number }>`
    height: ${({ $height }) => ($height ? `${$height}px` : 'auto')};
    transition: height 0.2s ${motionEasingStrings.transition};
`;

interface OutputsProps {
    disableAnim?: boolean; // used in tests, with animations enabled react-testing-library can't find output fields
}

export const Outputs = ({ disableAnim }: OutputsProps) => {
    const [height, setHeight] = useState(0);
    const [hasRenderedOutputs, setHasRenderedOutputs] = useState(false);

    const {
        outputs,
        account: { symbol },
    } = useSendFormContext();

    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current) return;

        const observer = new ResizeObserver(([entry]) => {
            if (entry) {
                setHeight(entry.contentRect.height);
            }
        });

        observer.observe(ref.current);

        return () => observer.disconnect();
    }, []);

    // needed to have no entrance animation on the first render
    // for some reason the first render does not have all the outputs
    useEffect(() => {
        if (outputs.length) {
            setHasRenderedOutputs(true);
        }
    }, [outputs]);

    const areTokensSupported = getNetworkFeatures(symbol).includes('tokens');

    return (
        <Container $height={height || 0}>
            <div ref={ref}>
                <Column gap={spacings.md}>
                    {outputs.map((output, index) => (
                        <motion.div
                            key={output.id}
                            initial={
                                index === 0 || !hasRenderedOutputs || disableAnim
                                    ? undefined
                                    : { opacity: 0, scale: 0.8 }
                            }
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                                duration: 0.2,
                                ease: motionEasing.transition,
                            }}
                        >
                            <Column gap={spacings.sm}>
                                {areTokensSupported && <TokenSelect outputId={index} />}
                                <Card>
                                    {output.type === 'opreturn' ? (
                                        <OpReturn outputId={index} />
                                    ) : (
                                        <Column gap={spacings.md}>
                                            <Address
                                                output={outputs[index]}
                                                outputId={index}
                                                outputsCount={outputs.length}
                                            />
                                            <Amount output={outputs[index]} outputId={index} />
                                        </Column>
                                    )}
                                </Card>
                            </Column>
                        </motion.div>
                    ))}
                </Column>
            </div>
        </Container>
    );
};
