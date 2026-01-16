import { useMemo } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { Translation } from '@suite/intl';
import { Banner, Button, Checkbox, Column, Row, Switch } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { EXPERIMENTAL_FEATURES_KB_URL } from '@trezor/urls';
import { typedObjectKeys } from '@trezor/utils';

import { SUITE } from 'src/actions/suite/constants';
import { goto } from 'src/actions/suite/routerActions';
import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { EXPERIMENTAL_FEATURES, ExperimentalFeature } from 'src/constants/suite/experimental';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectIsDebugModeActive } from 'src/selectors/suite/suiteSelectors';

type FeatureLineProps = {
    feature: ExperimentalFeature;
    enabledFeatures: ExperimentalFeature[];
};

const FeatureLine = ({ feature, enabledFeatures }: FeatureLineProps) => {
    const dispatch = useDispatch();
    const checked = enabledFeatures.includes(feature);

    const config = EXPERIMENTAL_FEATURES[feature];
    const { title, description } = config;
    const url = config.knowledgeBaseUrl;

    const onChangeFeature = async () => {
        const newValue = !checked;

        try {
            await config?.onToggle?.({ dispatch, newValue });
            dispatch({
                type: SUITE.SET_EXPERIMENTAL_FEATURES,
                payload: {
                    enabledFeatures: newValue
                        ? [...enabledFeatures, feature]
                        : enabledFeatures.filter(enabledFeature => enabledFeature !== feature),
                },
            });
        } catch (error) {
            console.error('Could not turn on an experimental feature: ', error);
        }
    };
    const handleClick = () => {
        if (!config.routeName) return;
        dispatch(goto(config.routeName));
    };

    return (
        <Row gap={spacings.sm}>
            <TextColumn
                title={title ? <Translation {...title} /> : feature}
                description={description ? <Translation {...description} /> : undefined}
                buttonLink={url}
                buttonTitle={<Translation id="TR_LEARN_MORE" />}
            />
            <ActionColumn>
                {config.routeName ? (
                    <Button intent="neutral" priority="secondary" onClick={handleClick}>
                        <Translation id="TR_GO_TO_EXP_FEATURE" />
                    </Button>
                ) : (
                    <Checkbox
                        isChecked={checked}
                        onClick={onChangeFeature}
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

export const Experimental = () => {
    const enabledFeatures = useSelector(state => state.suite.settings.experimental);
    const isDebug = useSelector(selectIsDebugModeActive);

    const dispatch = useDispatch();

    const onSwitchExperimental = () => {
        enabledFeatures?.forEach(feature =>
            EXPERIMENTAL_FEATURES[feature]?.onToggle?.({
                dispatch,
                newValue: false,
            }),
        );

        dispatch({
            type: SUITE.SET_EXPERIMENTAL_FEATURES,
            payload: { enabledFeatures: enabledFeatures === undefined ? [] : undefined },
        });
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
                        <Banner
                            icon="warning"
                            intent="warning"
                            description={<Translation id="TR_EXPERIMENTAL_FEATURES_WARNING" />}
                        />
                    }
                    buttonLink={EXPERIMENTAL_FEATURES_KB_URL}
                />
                <ActionColumn>
                    <Switch
                        isChecked={enabledFeatures !== undefined}
                        onChange={onSwitchExperimental}
                        data-testid="@settings/experimental-features/toggle-switch"
                    />
                </ActionColumn>
            </SectionItem>
            <AnimatePresence>
                {enabledFeatures && experimentalFeatures.length > 0 && (
                    <motion.div {...motionDivProps}>
                        <Column gap={spacings.xxl} hasDivider>
                            {experimentalFeatures.map(feature => (
                                <FeatureLine
                                    key={feature}
                                    feature={feature as ExperimentalFeature}
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
