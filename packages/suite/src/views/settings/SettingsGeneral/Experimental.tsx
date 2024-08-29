import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { Checkbox, Switch, Warning } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import { EXPERIMENTAL_FEATURES_KB_URL } from '@trezor/urls';

import { SUITE } from 'src/actions/suite/constants';
import { ActionColumn, SectionItem, TextColumn, Translation } from 'src/components/suite';
import { EXPERIMENTAL_FEATURES, ExperimentalFeature } from 'src/constants/suite/experimental';
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

type FeatureLineProps = {
    feature: ExperimentalFeature;
    enabledFeatures: ExperimentalFeature[];
};

const FeatureLine = ({ feature, enabledFeatures }: FeatureLineProps) => {
    const dispatch = useDispatch();
    const checked = enabledFeatures.includes(feature);

    const config = EXPERIMENTAL_FEATURES[feature];
    const titleId = config.title;
    const descId = config.description;
    const url = config.knowledgeBaseUrl;

    const onChangeFeature = () => {
        const newValue = !checked;

        config?.onToggle?.({ dispatch, newValue });

        dispatch({
            type: SUITE.SET_EXPERIMENTAL_FEATURES,
            payload: {
                enabledFeatures: newValue
                    ? [...enabledFeatures, feature]
                    : enabledFeatures.filter(enabledFeature => enabledFeature !== feature),
            },
        });
    };

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
    const enabledFeatures = useSelector(state => state.suite.settings.experimental);
    const isDebug = useSelector(selectIsDebugModeActive);

    const dispatch = useDispatch();

    const onSwitchExperimental = () => {
        enabledFeatures?.forEach(feature =>
            EXPERIMENTAL_FEATURES[feature]?.onToggle?.({ dispatch, newValue: false }),
        );

        dispatch({
            type: SUITE.SET_EXPERIMENTAL_FEATURES,
            payload: { enabledFeatures: enabledFeatures === undefined ? [] : undefined },
        });
    };

    const experimentalFeatures = Object.keys(EXPERIMENTAL_FEATURES).filter(
        feature =>
            !EXPERIMENTAL_FEATURES[feature as ExperimentalFeature]?.isDisabled?.({ isDebug }),
    );

    return (
        <>
            <SectionItem>
                <TextColumn
                    title={<Translation id="TR_EXPERIMENTAL_FEATURES_ALLOW" />}
                    description={
                        <Warning icon="warningTriangle" variant="warning">
                            <Translation id="TR_EXPERIMENTAL_FEATURES_WARNING" />
                        </Warning>
                    }
                    buttonLink={EXPERIMENTAL_FEATURES_KB_URL}
                />
                <ActionColumn>
                    <Switch
                        isChecked={enabledFeatures !== undefined}
                        onChange={onSwitchExperimental}
                    />
                </ActionColumn>
            </SectionItem>
            <AnimatePresence>
                {enabledFeatures && experimentalFeatures.length > 0 && (
                    <motion.div {...motionDivProps}>
                        {experimentalFeatures.map(feature => (
                            <FeatureLine
                                key={feature}
                                feature={feature as ExperimentalFeature}
                                enabledFeatures={enabledFeatures}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
