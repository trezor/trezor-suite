import styled from 'styled-components';
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
        <SectionItem>
            <TextColumn
                title={titleId ? <Translation id={titleId} /> : feature}
                description={descId && <Translation id={descId} />}
            />
            <ActionColumn>
                <Checkbox isChecked={checked} onClick={onChangeFeature} />
            </ActionColumn>
        </SectionItem>
    );
};

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
                    <Switch isChecked={!!features} onChange={onSwitchExperimental} />
                </ActionColumn>
            </SectionItem>
            {features &&
                Object.keys(ExperimentalFeature).length &&
                Object.values(ExperimentalFeature).map(feature => (
                    <FeatureLine key={feature} feature={feature} features={features} />
                ))}
        </>
    );
};
