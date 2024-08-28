import { getIconSize, Icon, iconSizes } from '@trezor/components';
import { useDispatch, useSelector, useTranslation } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { QuickActionButton } from './QuickActionButton';
import styled from 'styled-components';

const Relative = styled.div<{ $size: number }>`
    position: relative;
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
`;

const Absolute = styled.div`
    position: absolute;
    top: 0;
    left: 0;
`;

export const DebugAndExperimental = () => {
    const isEapEnabled = useSelector(state => state.desktopUpdate.allowPrerelease);
    const isExperimental = useSelector(state => state.suite.settings.experimental !== undefined);
    const isDebugMode = useSelector(state => state.suite.settings.debug.showDebugMenu);

    const { translationString } = useTranslation();
    const dispatch = useDispatch();

    const handleEapClick = () => {
        dispatch(goto('settings-index', { anchor: SettingsAnchor.EarlyAccess }));
    };

    if (!isEapEnabled && !isExperimental && !isDebugMode) return null;

    const tooltip = (
        <>
            {isDebugMode && <p>Debug Mode</p>}
            {isEapEnabled && <p>{translationString('TR_EARLY_ACCESS')}</p>}
            {isExperimental && <p>{translationString('TR_EXPERIMENTAL_FEATURES_ALLOW')}</p>}
        </>
    );

    return (
        <QuickActionButton tooltip={tooltip} onClick={handleEapClick}>
            <Relative $size={getIconSize(iconSizes.medium)}>
                {isDebugMode && (
                    <Absolute>
                        <Icon name="debug" variant="destructive" size={iconSizes.medium} />
                    </Absolute>
                )}
                {isExperimental && (
                    <Absolute>
                        <Icon name="experimental" variant="purple" size={iconSizes.medium} />
                    </Absolute>
                )}
                {isEapEnabled && (
                    <Absolute>
                        <Icon name="eap" variant="warning" size={iconSizes.medium} />
                    </Absolute>
                )}
            </Relative>
        </QuickActionButton>
    );
};
