import { useDispatch, useSelector } from 'react-redux';

import { analyticsActions, selectCustomAnalyticsUrl } from '@suite-common/analytics-redux';
import { yup } from '@suite-common/validators';
import { analytics } from '@suite-native/analytics';
import { Button, Card, Text, VStack } from '@suite-native/atoms';
import { Form, TextInputField, useForm } from '@suite-native/forms';
import { useToast } from '@suite-native/toasts';

const DEFAULT_CUSTOM_URL = '';

export const AnalyticsUrlControl = () => {
    const customUrl = useSelector(selectCustomAnalyticsUrl);
    const dispatch = useDispatch();
    const { showToast } = useToast();

    const form = useForm<{ analyticsUrl: string }>({
        defaultValues: {
            analyticsUrl: customUrl ?? DEFAULT_CUSTOM_URL,
        },
        validation: yup.object({
            analyticsUrl: yup.string(),
        }),
    });

    const {
        handleSubmit,
        formState: { isDirty },
        reset,
    } = form;

    const onSubmit = handleSubmit(values => {
        const trimmedUrl = values.analyticsUrl.trim();
        const url = trimmedUrl || undefined;
        dispatch(analyticsActions.setCustomAnalyticsUrl(url));
        analytics.setUrl(url);
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

    return (
        <Card>
            <VStack spacing="sp12">
                <Text variant="titleSmall">Analytics URL</Text>
                <Text variant="label" color="textSubdued">
                    Override the analytics endpoint URL. Leave empty and save to use the default.
                </Text>
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
                                size="small"
                                onPress={onSubmit}
                            >
                                Save
                            </Button>
                        )}
                        {customUrl && (
                            <Button
                                colorScheme="tertiaryElevation0"
                                size="small"
                                onPress={handleResetToDefault}
                            >
                                Reset to default
                            </Button>
                        )}
                    </VStack>
                </Form>
            </VStack>
        </Card>
    );
};
