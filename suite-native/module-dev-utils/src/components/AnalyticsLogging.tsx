import { useDispatch, useSelector } from 'react-redux';

import {
    analyticsActions,
    selectCustomAnalyticsUrl,
    selectIsAnalyticsEnabled,
    selectLoggerEnabled,
} from '@suite-common/analytics-redux';
import { yup } from '@suite-common/validators';
import { analytics } from '@suite-native/analytics';
import { Badge, Button, Card, CheckBox, Divider, HStack, Text, VStack } from '@suite-native/atoms';
import { Form, TextInputField, useForm } from '@suite-native/forms';
import { useToast } from '@suite-native/toasts';

const DEFAULT_CUSTOM_URL = '';

const urlSchema = yup.object({
    analyticsUrl: yup.string().url('Please enter a valid URL'),
});

type FormValues = yup.InferType<typeof urlSchema>;

export const AnalyticsLogging = () => {
    const customUrl = useSelector(selectCustomAnalyticsUrl);
    const loggerEnabled = useSelector(selectLoggerEnabled);
    const isAnalyticsEnabled = useSelector(selectIsAnalyticsEnabled);
    const dispatch = useDispatch();
    const { showToast } = useToast();

    const form = useForm<FormValues>({
        defaultValues: {
            analyticsUrl: customUrl ?? DEFAULT_CUSTOM_URL,
        },
        validation: urlSchema,
    });

    const {
        handleSubmit,
        formState: { isDirty },
        reset,
    } = form;

    const onSubmit = handleSubmit(values => {
        const trimmedUrl = values.analyticsUrl?.trim();
        const url = trimmedUrl || undefined;
        dispatch(analyticsActions.setCustomAnalyticsUrl(url));
        analytics.setUrl(url);
        reset({ analyticsUrl: trimmedUrl });
        showToast({
            message: url ? 'Analytics URL updated' : 'Analytics URL reset to default',
            variant: 'success',
        });
    });

    const handleResetToDefault = () => {
        reset({ analyticsUrl: DEFAULT_CUSTOM_URL });
        dispatch(analyticsActions.setCustomAnalyticsUrl(undefined));
        analytics.setUrl(undefined);
        showToast({
            message: 'Analytics URL reset to default',
            variant: 'success',
        });
    };

    const renderAnalyticsDisabledBadge = () => (
        <Badge
            label="Enable analytics to see the events."
            variant="yellow"
            icon="info"
            size="small"
        />
    );

    return (
        <Card>
            <VStack spacing="sp12">
                <Text variant="headline-sm">Analytics URL</Text>
                <Text variant="body-xs" color="contentSecondary">
                    Point to your own analytics server for testing.
                </Text>
                {customUrl && !isAnalyticsEnabled && renderAnalyticsDisabledBadge()}
                <Form form={form}>
                    <VStack>
                        <TextInputField
                            testID="@analytics-url-control/url-input"
                            name="analyticsUrl"
                            label="Custom analytics URL"
                        />
                        {isDirty && (
                            <Button
                                testID="@analytics-url-control/save-button"
                                size="medium"
                                onPress={onSubmit}
                            >
                                Save
                            </Button>
                        )}
                        {customUrl && (
                            <Button
                                intent="neutral"
                                priority="secondary"
                                size="medium"
                                onPress={handleResetToDefault}
                            >
                                Reset to default
                            </Button>
                        )}
                    </VStack>
                </Form>
                <Divider />
                <HStack justifyContent="space-between" paddingTop="sp8">
                    <VStack>
                        <Text>Console Logging</Text>
                        {loggerEnabled && !isAnalyticsEnabled && renderAnalyticsDisabledBadge()}
                    </VStack>
                    <CheckBox
                        testID="@analytics-url-control/logger-checkbox"
                        isChecked={!!loggerEnabled}
                        onChange={() => {
                            const newValue = !loggerEnabled;
                            dispatch(analyticsActions.setLoggerEnabled(newValue));
                            analytics.setLoggerEnabled(newValue);
                        }}
                    />
                </HStack>
            </VStack>
        </Card>
    );
};
