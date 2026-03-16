import { useRef, useState } from 'react';
import { View } from 'react-native';

import {
    Badge,
    type BadgeVariant,
    Box,
    Button,
    type ButtonColorProps,
    type ButtonSize,
    CheckBox,
    Divider,
    HStack,
    Hint,
    IconButton,
    InlineAlertBox,
    Input,
    type InputType,
    InputWrapper,
    NumPadButton,
    PriceChangeBadge,
    Radio,
    SearchInput,
    Switch,
    TEXT_BUTTON_SIZES,
    Text,
    TextButton,
    VStack,
} from '@suite-native/atoms';
import { isDevelopOrDebugEnv } from '@suite-native/config';
import { UpdateProgressIndicatorDemo } from '@suite-native/firmware';
import { CryptoIcon, Icon } from '@suite-native/icons';
import { Link } from '@suite-native/link';
import { Screen, ScreenHeader } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type NativeTypographyStyle } from '@trezor/theme';
import { TREZOR_URL } from '@trezor/urls';

const inputStackStyle = prepareNativeStyle(utils => ({
    borderRadius: utils.borders.radii.r16,
    padding: utils.spacings.sp8,
}));

const textVariants: NativeTypographyStyle[] = [
    'headline-lg',
    'headline-md',
    'headline-sm',
    'body-md-strong',
    'body-md',
    'body-sm-strong',
    'body-sm',
    'body-xs',
];

const buttonSizes = ['small', 'medium', 'large'] satisfies ButtonSize[];

const flexWrapStyle = prepareNativeStyle(_ => ({
    flexWrap: 'wrap',
}));

export const DemoScreen = () => {
    const { applyStyle } = useNativeStyles();
    const [input2Text, setInput2Text] = useState<string>('');
    const [input3Text, setInput3Text] = useState<string>('sf51s4afsfwfs8f4');
    const [radioChecked, setRadioChecked] = useState<string>('second');
    const [isCheckBox1Checked, setIsCheckBox1Checked] = useState(false);
    const [isCheckBox2Checked, setIsCheckBox2Checked] = useState(true);
    const [isCheckBox3Checked, setIsCheckBox3Checked] = useState(false);
    const [isCheckBox4Checked, setIsCheckBox4Checked] = useState(true);
    const [isSwitchActive, setIsSwitchActive] = useState<boolean>(true);
    const [isSwitch2Active, setIsSwitch2Active] = useState<boolean>(false);
    const demoInputRef = useRef<InputType | null>(null);

    const buttonColorVariants = [
        { label: 'brand/primary', buttonColorProps: { intent: 'brand', priority: 'primary' } },
        { label: 'neutral/primary', buttonColorProps: { intent: 'neutral', priority: 'primary' } },
        {
            label: 'neutral/secondary',
            buttonColorProps: { intent: 'neutral', priority: 'secondary' },
        },
        {
            label: 'critical/primary',
            buttonColorProps: { intent: 'critical', priority: 'primary' },
        },
        {
            label: 'critical/secondary',
            buttonColorProps: { intent: 'critical', priority: 'secondary' },
        },
        {
            label: 'warning/primary',
            buttonColorProps: { intent: 'warning', priority: 'primary' },
        },
        {
            label: 'warning/secondary',
            buttonColorProps: { intent: 'warning', priority: 'secondary' },
        },
        { label: 'info/primary', buttonColorProps: { intent: 'info', priority: 'primary' } },
        { label: 'info/secondary', buttonColorProps: { intent: 'info', priority: 'secondary' } },
    ] satisfies { label: string; buttonColorProps: ButtonColorProps }[];

    const textButtonColors = [
        { label: 'brand/primary', buttonColorProps: { intent: 'brand', priority: 'primary' } },
        {
            label: 'neutral/secondary',
            buttonColorProps: { intent: 'neutral', priority: 'secondary' },
        },
    ] satisfies { label: string; buttonColorProps: ButtonColorProps }[];
    const badgeVariants = [
        'neutral',
        'green',
        'greenSubtle',
        'yellow',
        'red',
        'bold',
    ] satisfies BadgeVariant[];

    const handleRadioPress = (value: string | number) => {
        setRadioChecked(value.toString());
    };

    if (!isDevelopOrDebugEnv()) return null;

    return (
        <Screen header={<ScreenHeader />}>
            <VStack spacing="sp16">
                <VStack>
                    <Text variant="headline-sm">Badge:</Text>
                    <HStack justifyContent="center" style={applyStyle(flexWrapStyle)}>
                        {badgeVariants.map(badgeVariant => (
                            <Badge
                                key={badgeVariant}
                                variant={badgeVariant}
                                label={badgeVariant}
                                icon="question"
                                elevation="0"
                            />
                        ))}
                        <Badge key="disabled" label="disabled" icon="question" isDisabled />
                    </HStack>
                </VStack>
                <VStack>
                    <Text variant="headline-sm">PriceChangeBadge:</Text>
                    <HStack justifyContent="center" style={applyStyle(flexWrapStyle)}>
                        <PriceChangeBadge valuePercentageChange={0.123} />
                        <PriceChangeBadge valuePercentageChange={-1.23} />
                        <PriceChangeBadge valuePercentageChange={0} />
                        <PriceChangeBadge valuePercentageChange={null} />
                    </HStack>
                </VStack>
                <Divider />
                <VStack>
                    <Text variant="headline-sm">Text:</Text>
                    {textVariants.map(variant => (
                        <Text variant={variant} key={variant}>
                            {variant}
                        </Text>
                    ))}
                </VStack>
                <VStack>
                    <Text variant="headline-sm">Button:</Text>
                    {buttonColorVariants.map(({ label, buttonColorProps }) => (
                        <VStack key={label}>
                            <Text>{label}</Text>
                            <Box
                                flexDirection="row"
                                justifyContent="space-around"
                                alignItems="center"
                                style={applyStyle(flexWrapStyle)}
                            >
                                {buttonSizes.map(buttonSize => (
                                    <Button
                                        key={buttonSize}
                                        {...buttonColorProps}
                                        iconLeft="calendar"
                                        size={buttonSize}
                                    >
                                        {buttonSize}
                                    </Button>
                                ))}
                            </Box>
                            <Box
                                flexDirection="row"
                                justifyContent="space-around"
                                alignItems="center"
                                style={applyStyle(flexWrapStyle)}
                            >
                                {buttonSizes.map(buttonSize => (
                                    <Button
                                        key={buttonSize}
                                        {...buttonColorProps}
                                        iconRight="calendar"
                                        size={buttonSize}
                                    >
                                        {buttonSize}
                                    </Button>
                                ))}
                            </Box>
                        </VStack>
                    ))}
                    <VStack>
                        <Text>Disabled</Text>
                        <Box
                            flexDirection="row"
                            justifyContent="space-around"
                            alignItems="center"
                            style={applyStyle(flexWrapStyle)}
                        >
                            {buttonSizes.map(buttonSize => (
                                <Button
                                    key={buttonSize}
                                    intent="brand"
                                    priority="primary"
                                    iconLeft="calendar"
                                    size={buttonSize}
                                    isDisabled
                                >
                                    {buttonSize}
                                </Button>
                            ))}
                        </Box>
                        <Box
                            flexDirection="row"
                            justifyContent="space-around"
                            alignItems="center"
                            style={applyStyle(flexWrapStyle)}
                        >
                            {buttonSizes.map(buttonSize => (
                                <Button
                                    key={buttonSize}
                                    intent="brand"
                                    priority="primary"
                                    iconLeft="calendar"
                                    size={buttonSize}
                                    isDisabled
                                >
                                    {buttonSize}
                                </Button>
                            ))}
                        </Box>
                        <Box
                            flexDirection="row"
                            justifyContent="space-around"
                            alignItems="center"
                            style={applyStyle(flexWrapStyle)}
                        >
                            {buttonSizes.map(buttonSize => (
                                <Button
                                    key={buttonSize}
                                    intent="brand"
                                    priority="primary"
                                    iconRight="calendar"
                                    size={buttonSize}
                                    isDisabled
                                >
                                    {buttonSize}
                                </Button>
                            ))}
                        </Box>
                    </VStack>
                </VStack>
                <Divider />
                <VStack>
                    <Text variant="headline-sm">IconButton:</Text>
                    {buttonColorVariants.map(({ label, buttonColorProps }) => (
                        <View key={label}>
                            <Text>{label}</Text>
                            <Box
                                flexDirection="row"
                                justifyContent="space-around"
                                alignItems="center"
                            >
                                {buttonSizes.map(buttonSize => (
                                    <IconButton
                                        key={buttonSize}
                                        {...buttonColorProps}
                                        iconName="calendar"
                                        size={buttonSize}
                                    />
                                ))}
                            </Box>
                        </View>
                    ))}
                </VStack>
                <VStack>
                    <Text variant="headline-sm">TextButton:</Text>
                    {textButtonColors.map(({ label, buttonColorProps }) => (
                        <HStack
                            key={label}
                            flexDirection="row"
                            justifyContent="space-around"
                            alignItems="center"
                        >
                            {TEXT_BUTTON_SIZES.map(buttonSize => (
                                <TextButton
                                    {...buttonColorProps}
                                    key={label + buttonSize}
                                    iconLeft="trezorSafe5"
                                    size={buttonSize}
                                >
                                    {buttonSize}
                                </TextButton>
                            ))}
                        </HStack>
                    ))}
                </VStack>
                <Divider />
                <Divider />
                <Box>
                    <SearchInput onChange={() => {}} placeholder="Type here.." />
                    <Box marginVertical="sp16">
                        <VStack style={applyStyle(inputStackStyle)} spacing="sp8">
                            <InputWrapper label="Recipient">
                                <Input
                                    ref={demoInputRef}
                                    value={input2Text}
                                    onChangeText={setInput2Text}
                                    label="To"
                                />
                            </InputWrapper>
                            <InputWrapper>
                                <Input
                                    value={input3Text}
                                    onChangeText={setInput3Text}
                                    label="From"
                                    leftIcon={<CryptoIcon symbol="btc" size="small" />}
                                    hasWarning
                                />
                            </InputWrapper>
                        </VStack>
                    </Box>
                    <Box marginVertical="sp16">
                        <VStack style={applyStyle(inputStackStyle)} spacing="sp8">
                            <InputWrapper hint="This input is not valid.">
                                <Input
                                    value={input2Text}
                                    onChangeText={setInput2Text}
                                    label="To"
                                    hasError
                                />
                            </InputWrapper>
                        </VStack>
                    </Box>
                    <Box marginTop="sp24">
                        <Text variant="headline-lg">Title Large</Text>
                    </Box>
                    <Box>
                        <Text variant="headline-md">Title Medium</Text>
                    </Box>
                    <Switch
                        isChecked={isSwitchActive}
                        onChange={() => setIsSwitchActive(!isSwitchActive)}
                    />
                    <Switch
                        isChecked={isSwitch2Active}
                        onChange={() => setIsSwitch2Active(!isSwitch2Active)}
                        isDisabled
                    />
                    <Box marginVertical="sp16">
                        <Text>Icon:</Text>
                        <Icon name="warningCircle" size="large" />
                    </Box>
                    <Box marginVertical="sp16">
                        <Text>Hints:</Text>
                        <Hint>Hned to mažem</Hint>
                        <Hint variant="error">Please enter a valid address dumbo</Hint>
                    </Box>
                    <Box marginVertical="sp16">
                        <Text>Radio:</Text>
                        <Box flexDirection="row" justifyContent="space-between">
                            <Radio
                                key="first"
                                value="first"
                                accessibilityLabel="First"
                                onPress={handleRadioPress}
                                isChecked={radioChecked === 'first'}
                            />
                            <Radio
                                key="second"
                                value="second"
                                accessibilityLabel="Second"
                                onPress={handleRadioPress}
                                isChecked={radioChecked === 'second'}
                            />
                        </Box>
                    </Box>
                    <Box marginVertical="sp16">
                        <Text>Checkbox:</Text>
                        <Box flexDirection="row" justifyContent="space-between">
                            <CheckBox
                                isChecked={isCheckBox1Checked}
                                onChange={() => setIsCheckBox1Checked(!isCheckBox1Checked)}
                            />
                            <CheckBox
                                isChecked={isCheckBox2Checked}
                                onChange={() => setIsCheckBox2Checked(!isCheckBox2Checked)}
                            />
                            <CheckBox
                                isChecked={isCheckBox3Checked}
                                onChange={() => setIsCheckBox3Checked(!isCheckBox3Checked)}
                                isDisabled
                            />
                            <CheckBox
                                isChecked={isCheckBox4Checked}
                                onChange={() => setIsCheckBox4Checked(!isCheckBox4Checked)}
                                isDisabled
                            />
                        </Box>
                    </Box>
                    <NumPadButton value={2} onPress={() => null} />
                    <Box marginTop="sp16" marginBottom="sp16">
                        <Text>AlertBox:</Text>
                        <VStack spacing="sp16">
                            <InlineAlertBox variant="info" title="Info" />
                            <InlineAlertBox variant="success" title="Success" />
                            <InlineAlertBox variant="critical" title="Error" />
                            <Box>
                                <InlineAlertBox variant="warning" title="Warning" />
                            </Box>
                            <InlineAlertBox
                                variant="info"
                                title={
                                    <>
                                        Info AlerBox with a longer text that does not fit one row
                                        and it can also contain{' '}
                                        <Link
                                            href={TREZOR_URL}
                                            label="for example link"
                                            isUnderlined
                                            textColor="textDefault"
                                        />
                                    </>
                                }
                            />
                        </VStack>
                    </Box>
                    <UpdateProgressIndicatorDemo />
                    {/* For some reason skeleton lags scrolling on iOS, we should investigate */}
                    {/* <VStack marginTop="sp16">
                        <Text variant="headline-md">Skeleton</Text>
                        <Card>
                            <ListItemSkeleton />
                        </Card>
                    </VStack> */}
                </Box>
            </VStack>
        </Screen>
    );
};
