import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { Checkbox, Switch, Icon, variables, Row } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import { EXPERIMENTAL_FEATURES_KB_URL } from '@trezor/urls';

import { SUITE } from 'src/actions/suite/constants';
import { ActionColumn, SectionItem, TextColumn, Translation } from 'src/components/suite';
import {
    ExperimentalFeature,
    ExperimentalFeatureTitle,
    ExperimentalFeatureDescription,
    ExperimentalFeatureKnowledgeBaseUrl,
} from 'src/constants/suite/experimental';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';

const FeatureLineWrapper = styled.div`
    display: flex;

    & + & {
        padding-top: ${spacingsPx.md};
        margin-top: ${spacingsPx.md};
        border-top: 1px solid ${({ theme }) => theme.borderElevation2};
    }
`;

const Warning = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.BOLD};
    margin-bottom: 4px;
`;

type FeatureLineProps = {
    feature: ExperimentalFeature;
    features: ExperimentalFeature[];
};

const FeatureLine = ({ feature, features }: FeatureLineProps) => {
    const dispatch = useDispatch();
    const checked = features.includes(feature);
    const titleId = ExperimentalFeatureTitle[feature];
    const descId = ExperimentalFeatureDescription[feature];
    const url = ExperimentalFeatureKnowledgeBaseUrl[feature];

    const onChangeFeature = () =>
        dispatch({
            type: SUITE.SET_EXPERIMENTAL_FEATURES,
            payload: !checked ? [...features, feature] : features.filter(f => f !== feature),
        });

    return (
        <FeatureLineWrapper>
            <TextColumn
                title={titleId ? <Translation id={titleId} /> : feature}
                description={descId && <Translation id={descId} />}
                buttonLink={url}
                buttonTitle={<Translation id="TR_LEARN_MORE" />}
            />
            <ActionColumn>
                <Checkbox isChecked={checked} onClick={onChangeFeature} />
            </ActionColumn>
        </FeatureLineWrapper>
    );
};

const motionDivProps = {
    variants: {
        initial: { overflow: 'hidden', height: 0, marginTop: '-32px', opacity: 0 },
        visible: {
            height: 'auto',
            marginTop: 0,
            opacity: 1,
            transitionEnd: { overflow: 'unset' },
        },
    },
    transition: { duration: 0.24, ease: 'easeInOut' },
    initial: 'initial',
    animate: 'visible',
    exit: 'initial',
} as const;

export const Experimental = () => {
    const features = useSelector(state => state.suite.settings.experimental);
    const isDebug = useSelector(selectIsDebugModeActive);

    const dispatch = useDispatch();

    const onSwitchExperimental = () =>
        dispatch({
            type: SUITE.SET_EXPERIMENTAL_FEATURES,
            payload: !features ? [] : undefined,
        });

    return (
        <>
            <SectionItem>
                <TextColumn
                    title={<Translation id="TR_EXPERIMENTAL_FEATURES_ALLOW" />}
                    description={
                        <>
                            <Warning>
                                <Row gap={12}>
                                    <Icon icon="WARNING" size={14} variant="tertiary" />
                                    <Translation id="TR_EXPERIMENTAL_FEATURES_WARNING" />
                                </Row>
                            </Warning>
                            <Translation id="TR_EXPERIMENTAL_FEATURES_DESCRIPTION" />
                        </>
                    }
                    buttonLink={EXPERIMENTAL_FEATURES_KB_URL}
                />
                <ActionColumn>
                    <Switch isChecked={!!features} onChange={onSwitchExperimental} />
                </ActionColumn>
            </SectionItem>
            <AnimatePresence>
                {features && Object.keys(ExperimentalFeature).length && (
                    <motion.div {...motionDivProps}>
                        {Object.values(ExperimentalFeature).map(feature => {
                            // not very systematic way how to exclude some features but freeze is happening
                            if (feature === ExperimentalFeature.PasswordManager && !isDebug)
                                return null;

                            return (
                                <FeatureLine key={feature} feature={feature} features={features} />
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
