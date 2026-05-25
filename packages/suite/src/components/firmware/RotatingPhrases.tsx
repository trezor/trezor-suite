import { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { Translation, type TranslationKey } from '@suite/intl';
import { Card, H4, Paragraph, motionEasing } from '@trezor/components';

const PHRASES: TranslationKey[] = [
    'TR_DYK_ITEM_1',
    'TR_DYK_ITEM_2',
    'TR_DYK_ITEM_3',
    'TR_DYK_ITEM_4',
    'TR_DYK_ITEM_5',
    'TR_DYK_ITEM_6',
    'TR_DYK_ITEM_7',
    'TR_DYK_ITEM_8',
    'TR_DYK_ITEM_9',
    'TR_DYK_ITEM_10',
    'TR_DYK_ITEM_11',
];

type RotatingPhrasesProps = {
    interval?: number;
};

export const RotatingPhrases = ({ interval = 10000 }: RotatingPhrasesProps) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const id = setInterval(() => {
            setIndex(prev => (prev + 1) % PHRASES.length);
        }, interval);

        return () => clearInterval(id);
    }, [interval]);

    return (
        <Card fillType="flat" paddingType="large">
            <H4
                typographyStyle="body-sm-strong"
                intent="neutral"
                priority="secondary"
                align="center"
                margin={{ bottom: 12 }}
            >
                <Translation id="TR_DYK_TITLE" />
            </H4>
            <div role="status" aria-live="polite" aria-atomic>
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.3, ease: motionEasing.enter }}
                    >
                        <Paragraph align="center">
                            <Translation id={PHRASES[index] ?? 'TR_DYK_ITEM_1'} />
                        </Paragraph>
                    </motion.div>
                </AnimatePresence>
            </div>
        </Card>
    );
};
