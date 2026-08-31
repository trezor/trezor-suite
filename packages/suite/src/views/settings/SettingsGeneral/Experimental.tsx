import { useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { AnimatePresence, motion } from 'framer-motion';

import { selectIsDebugModeActive } from '@suite/debug';
import { type ExperimentalFeature } from '@suite/experimental';
import { LearnMoreButton } from '@suite/external-links';
import { feedbackRequested } from '@suite/feature-feedback';
import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { selectExperimentalFeatures, suiteSettingsActions } from '@suite/settings';
import { useImperativeServices } from '@suite-common/dependency-injection';
import { useSelector } from '@suite-common/redux-utils';
import { Banner, Button, Checkbox, Column, Row, Switch } from '@trezor/components';
import { WarningIcon } from '@trezor/icons';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
import { EXPERIMENTAL_FEATURES_KB_URL } from '@trezor/urls';
import { typedObjectKeys } from '@trezor/utils';

import { EXPERIMENTAL_FEATURES } from 'src/constants/suite/experimental';
import { selectSuiteServices } from 'src/support/extraDependencies';

type FeatureLineProps = {
    feature: ExperimentalFeature;
    enabledFeatures: ExperimentalFeature[];
};

const FeatureLine = ({ feature, enabledFeatures }: FeatureLineProps) => {
    const dispatch = useDispatch();
    const services = useImperativeServices(selectSuiteServices);
    const checked = enabledFeatures.includes(feature);

    const config = EXPERIMENTAL_FEATURES[feature];
    const { title, description } = config;
    const url = config.knowledgeBaseUrl;

    const onChangeFeature = async () => {
        const newValue = !checked;

        try {
            await config?.onToggle?.({ services, newValue, dispatch });
            dispatch(
                suiteSettingsActions.setExperimentalFeatures(
                    newValue
                        ? [...enabledFeatures, feature]
                        : enabledFeatures.filter(enabledFeature => enabledFeature !== feature),
                ),
            );
            if (!newValue) {
                dispatch(feedbackRequested({ feature, isFeatureBeingDisabled: true }));
            }
        } catch (error) {
            console.error('Could not turn on an experimental feature: ', error);
        }
    };

    const handleClick = () => {
        if (!config.routeName) return;
        dispatch(goto({ routeName: config.routeName }));
    };

    return (
        <Row gap={12}>
            <TextColumn
                title={title ? <Translation {...title} /> : feature}
                description={description ? <Translation {...description} /> : undefined}
                bottomContent={url ? <LearnMoreButton url={url} /> : undefined}
            />
            <ActionColumn>
                {config.routeName ? (
                    <Button intent="neutral" priority="secondary" onClick={handleClick}>
                        <Translation id="TR_GO_TO_EXP_FEATURE" />
                    </Button>
                ) : (
                    <Checkbox
                        isChecked={checked}
                        onChange={onChangeFeature}
                        data-testid={`@settings/experimental-features/${feature}-checkbox`}
                    />
                )}
            </ActionColumn>
        </Row>
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

const bannerMotionDivProps = {
    variants: {
        initial: { overflow: 'hidden', height: 0, marginTop: 0, opacity: 0 },
        visible: {
            height: 'auto',
            marginTop: '12px',
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
    const enabledFeatures = useSelector(selectExperimentalFeatures);
    const isExperimentalEnabled = enabledFeatures !== undefined;
    const isDebug = useSelector(selectIsDebugModeActive);

    const dispatch = useDispatch();
    const services = useImperativeServices(selectSuiteServices);

    const onSwitchExperimental = () => {
        enabledFeatures?.forEach(feature =>
            EXPERIMENTAL_FEATURES[feature]?.onToggle?.({
                services,
                newValue: !isExperimentalEnabled,
                dispatch,
            }),
        );

        dispatch(
            suiteSettingsActions.setExperimentalFeatures(
                enabledFeatures === undefined ? [] : undefined,
            ),
        );
    };

    const experimentalFeatures = useMemo(
        () =>
            typedObjectKeys(EXPERIMENTAL_FEATURES).filter(
                feature =>
                    !EXPERIMENTAL_FEATURES[feature]?.isDisabled?.({
                        isDebug,
                    }),
            ),
        [isDebug],
    );

    return (
        <>
            <SectionItem>
                <TextColumn
                    title={<Translation id="TR_EXPERIMENTAL_FEATURES_ALLOW" />}
                    description={
                        <>
                            <Translation id="TR_EXPERIMENTAL_FEATURES_DESCRIPTION" />
                            <AnimatePresence>
                                {isExperimentalEnabled && (
                                    <motion.div {...bannerMotionDivProps}>
                                        <Banner
                                            icon={WarningIcon}
                                            intent="warning"
                                            description={
                                                <Translation id="TR_EXPERIMENTAL_FEATURES_WARNING_IF_ENABLED" />
                                            }
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </>
                    }
                    bottomContent={<LearnMoreButton url={EXPERIMENTAL_FEATURES_KB_URL} />}
                />
                <ActionColumn>
                    <Switch
                        isChecked={isExperimentalEnabled}
                        onChange={onSwitchExperimental}
                        data-testid="@settings/experimental-features/toggle-switch"
                    />
                </ActionColumn>
            </SectionItem>
            <AnimatePresence>
                {enabledFeatures && experimentalFeatures.length > 0 && (
                    <motion.div {...motionDivProps}>
                        <Column gap={32} hasDivider>
                            {experimentalFeatures.map(feature => (
                                <FeatureLine
                                    key={feature}
                                    feature={feature}
                                    enabledFeatures={enabledFeatures}
                                />
                            ))}
                        </Column>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
