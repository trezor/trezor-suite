import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

import { Card, motionEasing } from '@trezor/components';
import { motionEasingStrings } from '@trezor/components/src/config/motion';
import { spacingsPx } from '@trezor/theme';
import { networks } from '@suite-common/wallet-config';

import { useSendFormContext } from 'src/hooks/wallet';
import { useLayoutSize } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';
import { Address } from './Address';
import { Amount } from './Amount/Amount';
import { OpReturn } from './OpReturn';
import { CoinLogo } from '@trezor/product-components';
import { TokenSelect } from './Amount/TokenSelect';
const Container = styled.div<{ $height: number }>`
    height: ${({ $height }) => ($height ? `${$height}px` : 'auto')};
    transition: height 0.2s ${motionEasingStrings.transition};

    > div {
        display: flex;
        flex-direction: column;
        gap: ${spacingsPx.md};
    }
`;

const StyledEvmExplanation = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: ${spacingsPx.sm};
`;

interface OutputsProps {
    disableAnim?: boolean; // used in tests, with animations enabled react-testing-library can't find output fields
}

export const Outputs = ({ disableAnim }: OutputsProps) => {
    const [height, setHeight] = useState(0);
    const [hasRenderedOutputs, setHasRenderedOutputs] = useState(false);
    const size = useLayoutSize();

    const {
        outputs,
        formState: { errors },
        account,
    } = useSendFormContext();
    const ref = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        setHeight(ref.current?.offsetHeight || 0);
    }, [outputs, errors.outputs, size]);

    // needed to have no entrance animation on the first render
    // for some reason the first render does not have all the outputs
    useEffect(() => {
        if (outputs.length) {
            setHasRenderedOutputs(true);
        }
    }, [outputs]);

    return (
        <Container $height={height || 0}>
            <div ref={ref}>
                {outputs.map((output, index) => (
                    <motion.div
                        layout
                        key={output.id}
                        initial={
                            index === 0 || !hasRenderedOutputs || disableAnim
                                ? undefined
                                : { scale: 0.8, opacity: 0 }
                        }
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                            duration: 0.2,
                            ease: motionEasing.transition,
                        }}
                    >
                        <TokenSelect outputId={index} />
                        <Card
                            label={
                                account.networkType === 'ethereum' && (
                                    <StyledEvmExplanation>
                                        <CoinLogo symbol={account.symbol} size={16} />
                                        <Translation
                                            id="TR_EVM_EXPLANATION_SEND_DESCRIPTION"
                                            values={{
                                                network: networks[account.symbol].name,
                                            }}
                                        />
                                    </StyledEvmExplanation>
                                )
                            }
                        >
                            {output.type === 'opreturn' ? (
                                <OpReturn outputId={index} />
                            ) : (
                                <>
                                    <Address
                                        output={outputs[index]}
                                        outputId={index}
                                        outputsCount={outputs.length}
                                    />
                                    <Amount output={outputs[index]} outputId={index} />
                                </>
                            )}
                        </Card>
                    </motion.div>
                ))}
            </div>
        </Container>
    );
};
