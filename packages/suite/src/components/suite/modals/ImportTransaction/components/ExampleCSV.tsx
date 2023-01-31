import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { P, Icon, variables, motionAnimation } from '@trezor/components';
import { Translation } from '@suite-components';
import { useSelector, useTranslation } from '@suite-hooks';
import { selectIsLabelingAvailable } from '@suite-reducers/metadataReducer';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: start;
    padding-bottom: 16px;
`;

const ExpandWrapper = styled(motion.div)`
    width: 100%;
    background: ${props => props.theme.BG_GREY};
    border-radius: 8px;
    overflow: hidden;
    margin-top: 8px;
    padding: 12px;
    text-align: left;
`;

const ExpandButton = styled.div`
    display: flex;
    cursor: pointer;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: 500;
    justify-content: space-between;
`;

export const ExampleCSV = () => {
    const [isExpanded, setExpanded] = useState(false);
    const { account } = useSelector(state => state.wallet.selectedAccount);
    const isLabelingAvailable = useSelector(selectIsLabelingAvailable);
    const { translationString } = useTranslation();

    if (!account) return null;

    // for BTC get first two unused addresses
    // for ETH and XRP descriptor get twice (used in two examples)
    const addresses = account.addresses?.unused.slice(0, 2).map(a => a.address) || [
        account.descriptor,
        account.descriptor,
    ];

    return (
        <Wrapper>
            <ExpandButton
                onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setExpanded(!isExpanded);
                }}
            >
                <Translation
                    id={
                        isExpanded
                            ? 'TR_IMPORT_CSV_MODAL_HIDE_EXAMPLE'
                            : 'TR_IMPORT_CSV_MODAL_SHOW_EXAMPLE'
                    }
                />
                <Icon size={16} icon={!isExpanded ? 'ARROW_DOWN' : 'ARROW_UP'} />
            </ExpandButton>

            <AnimatePresence initial={false}>
                {isExpanded && (
                    <ExpandWrapper {...motionAnimation.expand}>
                        {/* CSV keys shouldn't be translated */}
                        <P size="small">address,amount,currency{isLabelingAvailable && ',label'}</P>
                        <P size="small">
                            {addresses[0]},0.31337,{account.symbol.toUpperCase()}
                            {isLabelingAvailable &&
                                `,${translationString('TR_SENDFORM_LABELING_EXAMPLE_1')}`}
                        </P>
                        <P size="small">
                            {addresses[1]},0.1,USD
                            {isLabelingAvailable &&
                                `,${translationString('TR_SENDFORM_LABELING_EXAMPLE_2')}`}
                        </P>
                    </ExpandWrapper>
                )}
            </AnimatePresence>
        </Wrapper>
    );
};
