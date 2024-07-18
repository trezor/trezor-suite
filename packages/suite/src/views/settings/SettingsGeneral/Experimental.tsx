import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { Checkbox, Switch, Icon, variables } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';

import { SUITE } from 'src/actions/suite/constants';
import { ActionColumn, SectionItem, TextColumn, Translation } from 'src/components/suite';
import {
    ExperimentalFeature,
    ExperimentalFeatureTitle,
    ExperimentalFeatureDescription,
} from 'src/constants/suite/experimental';
import { useDispatch, useSelector } from 'src/hooks/suite';

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
            />
            <ActionColumn>
                <Checkbox
                    isChecked={checked}
                    onClick={onChangeFeature}
                    data-test={`@experimental-feature/${feature}/checkbox`}
                />
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
                                <Icon icon="WARNING" size={14} variant="tertiary" />
                                <Translation id="TR_EXPERIMENTAL_FEATURES_WARNING" />
                            </Warning>
                            <Translation id="TR_EXPERIMENTAL_FEATURES_DESCRIPTION" />
                        </>
                    }
                />
                <ActionColumn>
                    <Switch
                        isChecked={!!features}
                        onChange={onSwitchExperimental}
                        dataTest="@settings/experimental-switch"
                    />
                </ActionColumn>
            </SectionItem>
            <AnimatePresence>
                {features && Object.keys(ExperimentalFeature).length && (
                    <motion.div {...motionDivProps}>
                        {Object.values(ExperimentalFeature).map(feature => (
                            <FeatureLine key={feature} feature={feature} features={features} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
