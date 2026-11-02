import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';

import { getNetworkFeatures } from '@suite-common/wallet-config';
import { Card, Column, motionEasing, useHeightAnimationOnChange } from '@trezor/components';

import { useSendFormContext } from 'src/hooks/wallet';

import { Address } from './Address';
import { Amount } from './Amount/Amount';
import { CardanoMinAmountInfo } from './CardanoMinAmountInfo';
import { OpReturn } from './OpReturn';
import { TokenSelect } from './TokenSelect/TokenSelect';
import { DestinationTag } from '../Options/MiscNetworkOptions/DestinationTag';

interface OutputsProps {
    disableAnim?: boolean; // used in tests, with animations enabled react-testing-library can't find output fields
}

export const Outputs = ({ disableAnim }: OutputsProps) => {
    // React Compiler: `getValues` keeps one identity for the form's whole life, so a compiled
    // render-time read of it freezes on the first render. Remove once these reads move to
    // `useWatch` or out of render.
    'use no memo';

    const [hasRenderedOutputs, setHasRenderedOutputs] = useState(false);

    const {
        outputs,
        account: { symbol },
        getValues,
    } = useSendFormContext();

    // Only adding or removing an output slides the content below, typing never does.
    const containerRef = useHeightAnimationOnChange({
        trigger: outputs.length,
        isDisabled: disableAnim || !hasRenderedOutputs,
    });

    const formOutputs = getValues().outputs;
    const isSendingTokens = formOutputs?.some(output => !!output.token);

    // needed to have no entrance animation on the first render
    // for some reason the first render does not have all the outputs
    useEffect(() => {
        if (outputs.length) {
            setHasRenderedOutputs(true);
        }
    }, [outputs]);

    const areTokensSupported = getNetworkFeatures(symbol).includes('tokens');

    return (
        <div ref={containerRef}>
            <Column gap={16}>
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
                        <Column gap={12}>
                            {areTokensSupported && <TokenSelect outputId={index} />}
                            <Card>
                                {output.type === 'opreturn' ? (
                                    <OpReturn outputId={index} />
                                ) : (
                                    <Column gap={16}>
                                        <Address
                                            output={output}
                                            outputId={index}
                                            outputsCount={outputs.length}
                                        />
                                        <Amount output={output} outputId={index} />
                                        {outputs.length === 1 && isSendingTokens && (
                                            <CardanoMinAmountInfo />
                                        )}
                                    </Column>
                                )}
                            </Card>

                            {output.type !== 'opreturn' && (
                                <DestinationTag networkSymbol={symbol} />
                            )}
                        </Column>
                    </motion.div>
                ))}
            </Column>
            {outputs.length > 1 && isSendingTokens && (
                <Card margin={{ vertical: 16 }}>
                    <Column gap={16}>
                        <CardanoMinAmountInfo />
                    </Column>
                </Card>
            )}
        </div>
    );
};
