import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    type DemoAccountQuestionnaireStackParamList,
    DemoAccountQuestionnaireStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { DemoAccountQuestionnaireIntroScreen } from '../screens/DemoAccountQuestionnaireIntroScreen';
import { DemoAccountQuestionnaireReasonScreen } from '../screens/DemoAccountQuestionnaireReasonScreen';
import { DemoAccountQuestionnaireSuccessScreen } from '../screens/DemoAccountQuestionnaireSuccessScreen';
import { DemoAccountQuestionnaireSuiteActionScreen } from '../screens/DemoAccountQuestionnaireSuiteActionScreen';

const DemoAccountQuestionnaireStack =
    createNativeStackNavigator<DemoAccountQuestionnaireStackParamList>();

export const DemoAccountQuestionnaireStackNavigator = () => (
    <DemoAccountQuestionnaireStack.Navigator
        initialRouteName={DemoAccountQuestionnaireStackRoutes.Intro}
        screenOptions={stackNavigationOptionsConfig}
    >
        <DemoAccountQuestionnaireStack.Screen
            options={{ title: DemoAccountQuestionnaireStackRoutes.Intro }}
            name={DemoAccountQuestionnaireStackRoutes.Intro}
            component={DemoAccountQuestionnaireIntroScreen}
        />
        <DemoAccountQuestionnaireStack.Screen
            options={{ title: DemoAccountQuestionnaireStackRoutes.Reason }}
            name={DemoAccountQuestionnaireStackRoutes.Reason}
            component={DemoAccountQuestionnaireReasonScreen}
        />
        <DemoAccountQuestionnaireStack.Screen
            options={{ title: DemoAccountQuestionnaireStackRoutes.SuiteAction }}
            name={DemoAccountQuestionnaireStackRoutes.SuiteAction}
            component={DemoAccountQuestionnaireSuiteActionScreen}
        />
        <DemoAccountQuestionnaireStack.Screen
            options={{ title: DemoAccountQuestionnaireStackRoutes.Success }}
            name={DemoAccountQuestionnaireStackRoutes.Success}
            component={DemoAccountQuestionnaireSuccessScreen}
        />
    </DemoAccountQuestionnaireStack.Navigator>
);
