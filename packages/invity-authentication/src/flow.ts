/**
    NOTE: Do not set style to elements explicitly (like element.setAttribute('style', '...')).
    Browser doesn't allow to change style attribute due to security reason.
    Use element.classList.add/remove instead.    
 */

const showSpinner = active => {
    const spinner = document.getElementById('spinner-div');
    if (!spinner) {
        return;
    }
    if (window.top.location.pathname === '/account/reset-sent') {
        active = false;
    }
    spinner.classList.toggle('hidden', !active);
};

const sendMessageToParent = (data, _showSpinner = true) => {
    // Send a message to the parent window (ask for a redirect, or inform it whether the user is authorized)
    if (_showSpinner) {
        showSpinner(true);
    }
    window.top.postMessage(
        JSON.stringify({
            name: 'invity-authentication',
            ...data,
        }),
        '*', // TODO: only allowed origins
    );
};

const translate = (translations, key, fallback) => {
    if (!translations) {
        console.error(`Translations are not defined, falling back to "${fallback}"`);
        return fallback;
    }
    if (!translations[key]) {
        console.error(`Translation error: key "${key}" not found, falling back to "${fallback}"`);
        return fallback;
    }
    return translations[key];
};

const translateForm = flowType => {
    const spinner = document.getElementById('loading_spinner');
    if (spinner) {
        spinner.innerText = 'Loading...';
    }

    const email = document.getElementById('auth_email_label');
    if (email) {
        email.innerText = 'Email address';
    }

    const password = document.getElementById('auth_password_label');
    if (password) {
        password.innerText = 'Password';
    }

    const passwordDiv = document.getElementById('auth_password');
    if (passwordDiv) {
        const passwordInput = passwordDiv.getElementsByTagName('input')[0];
        passwordInput.placeholder = 'your password';
    }

    const submit = document.getElementById('submit');
    if (submit) {
        switch (flowType) {
            case 'login':
                submit.innerText = 'Log in';
                break;
            case 'registration':
                submit.innerText = 'Sign up';
                break;
            case 'recovery':
                submit.innerText = 'Recover';
                break;
            default:
                submit.innerText = 'Submit';
                break;
        }
    }

    const forgotPassword = document.getElementById('forgot_password_link');
    if (forgotPassword) {
        forgotPassword.innerText = 'Forgot your password?';
    }

    const verificationDiv = document.getElementById('verification') as HTMLDivElement;
    if (verificationDiv) {
        const submitVerification = verificationDiv.getElementsByTagName('button')[0];
        submitVerification.innerText = 'Re-send e-mail';
        verificationDiv.innerHTML = `Nothing arrived? ${submitVerification.innerHTML}`;
    }
};

const disableForm = () => {
    const email = document.getElementById('auth_email');
    if (email) {
        email.getElementsByTagName('input')[0].disabled = true;
    }
    const password = document.getElementById('auth_password');
    if (password) {
        password.getElementsByTagName('input')[0].disabled = true;
    }
    const submitButton = document.getElementById('submit') as HTMLButtonElement;
    submitButton.disabled = true;
};

const showMessage = (type, msg, _disableForm = false) => {
    if (_disableForm) {
        disableForm();
    }
    if (type === 'info') {
        const elem = document.getElementById(type);
        elem.innerText = msg;
        return;
    }
    const popup = document.getElementById('popup');
    const submit = document.getElementById('submit');
    popup.style.setProperty('display', 'initial');
    submit.style.setProperty('display', 'none');
    document.getElementById('popup-text').innerText = msg;
    sendMessageToParent({ action: { type: 'resize' } }, false);
};

const onErrorClick = () => {
    const popup = document.getElementById('popup');
    const submit = document.getElementById('submit');
    popup.style.setProperty('display', 'none');
    submit.style.setProperty('display', 'initial');
};

const getVerificationCookie = () => {
    const match = document.cookie.match(new RegExp('(^| )invity_verification_email=([^;]+)'));
    if (match) {
        return match[2];
    }
    return null;
};

const inIframe = () => {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
};

const getUrls = (flowType: string) => {
    const urlSearchParameters = new URLSearchParams(window.location.search);
    const returnToUrl = urlSearchParameters.get('return_to');

    const authServerUrl = window.location.hash.replace('#', '');
    let flowUrl = `${authServerUrl}/self-service/${flowType}/flows`;
    let redirectUrl = `/account/${flowType}`;
    const browserUrl = new URL(`${authServerUrl}/self-service/${flowType}/browser`);
    if (returnToUrl) {
        browserUrl.searchParams.append('return_to', returnToUrl);
    }
    if (flowType === 'recovery') {
        redirectUrl = redirectUrl.replace('recovery', 'reset');
    } else if (flowType === 'error') {
        flowUrl = `${authServerUrl}/self-service/errors`;
    }
    return { authServerUrl, flowUrl, redirectUrl, browserUrl: browserUrl.toString() };
};

const exit = () => {
    // Used to stop this script's execution, for example right after requesting a redirect
    // eslint-disable-next-line no-throw-literal
    throw 'exit';
};

const die = message => {
    // Same as exit, but will also print error details to console.error
    if (typeof message === 'object' && message !== null) {
        throw new Error(JSON.stringify(message));
    } else {
        throw new Error(message);
    }
};

const getFlowId = (urls, flowType) => {
    const urlParams = new URLSearchParams(window.location.search);
    const flowId = urlParams.get('flow');

    if (flowType === 'error') {
        sendMessageToParent({ action: { type: 'resize' } });
        return urlParams.get('error');
    }

    if (!flowId) {
        // Flow id not found, redirect to kratos browser, get a new flow ID and return back to this page
        window.location.replace(urls.browserUrl);
        exit();
    }
    sendMessageToParent({ action: { type: 'resize' } });
    return flowId;
};

const getFlowInfo = async (urls, flowType) => {
    showSpinner(true);
    // Get flow Id from URL params
    const flowId = getFlowId(urls, flowType);
    // Request form info for the flow ID, or get redirected
    let url = `${urls.flowUrl}?id=${flowId}`;
    if (flowType === 'error') {
        url = `${urls.flowUrl}?error=${flowId}`;
    }
    const response = await fetch(url, {
        headers: {
            Accept: 'application/json',
        },
        credentials: 'include',
    });
    const json = await response.json();
    showSpinner(false);
    if (json.error) {
        if (json?.error?.details?.redirect_to) {
            // Flow has expired - reload an iframe & get a new flow ID
            window.location.replace(json.error.details.redirect_to);
            return exit();
        }
        showMessage('error', 'An unexpected error has occured.');
        die(json.error);
    }
    return json;
};

const prefillEmail = (email = '', flowType) => {
    const emailInput = document.getElementById('auth_email').getElementsByTagName('input')[0];
    if (email && flowType === 'settings') {
        emailInput.placeholder = email;
        return true;
    }
    // Prefill the verification email field using either whoami data, or a cookie
    if (
        ['verification', 'recovery'].includes(flowType) === false ||
        window.top.location.pathname === '/account/reset'
    ) {
        return null;
    }
    if (!email) {
        email = getVerificationCookie();
    }
    if (email) {
        emailInput.value = email;
        return true;
    }
    return false;
};

const setLogoutOnSubmit = () => {
    const form = document.getElementById('form');
    form.onsubmit = () => {
        sendMessageToParent({ redirectTo: 'logout' }); // Log out the user, then redirect to /account/login
        return false; // do not submit the form
    };
};

const reloadAfterTimeout = (urls, flowType) => {
    // One minute before the flow ID is about to expire, reload the form to get a new one
    let expirationTimeMinutes;
    switch (flowType) {
        case 'login':
        case 'registration':
        case 'settings':
            expirationTimeMinutes = 30;
            break;

        case 'verification':
        case 'recovery':
            expirationTimeMinutes = 120;
            break;

        default:
            die(`Unexpected flowType: ${flowType}`);
            break;
    }
    if (expirationTimeMinutes) {
        setTimeout(() => {
            window.location.replace(urls.browserUrl);
        }, expirationTimeMinutes * 60 * 1000);
    }
};

const checkPrivilegedSession = (authenticatedAt: number, flowType) => {
    if (flowType !== 'settings') {
        return;
    }
    const maxPrivilegedSessionTime = 5; // This value corresponds to flows.settings.privileged_session_max_age from Kratos config
    const timeDiff = new Date().valueOf() - authenticatedAt;
    const minutesSinceAuthentication = Math.floor(timeDiff / 1000 / 60);
    if (minutesSinceAuthentication > maxPrivilegedSessionTime) {
        setLogoutOnSubmit(); // Session already expired, make the submit button log out the user
    } else {
        // After the privileged session expires, make the submit button log out the user
        setTimeout(() => {
            setLogoutOnSubmit();
        }, maxPrivilegedSessionTime * 60 * 1000 - timeDiff);
    }
};

const checkWhoami = async (flowType, urls) => {
    try {
        showSpinner(true);
        const response = await fetch(`${urls.authServerUrl}/sessions/whoami`, {
            credentials: 'include',
        });
        const data = await response.json();
        showSpinner(false);
        if (data.error) {
            // Unauthorized, prefill e-mail from cookie (only for verification & recovery flows)
            if (prefillEmail(null, flowType) === false) {
                if (window.top.location.pathname === '/account/reset-sent') {
                    // cannot pre-fill recovery email, redir to "reset"
                    sendMessageToParent({ redirectTo: 'recovery' });
                } else if (window.top.location.pathname === '/account/verification') {
                    // cannot pre-fill verif email, redir to "signup"
                    sendMessageToParent({ redirectTo: 'registration' });
                }
                exit();
            }
        } else {
            checkPrivilegedSession(new Date(data.authenticated_at).valueOf(), flowType); // If privileged session expired, log out on submit
            const verifiableAddress = data.identity.verifiable_addresses[0];
            if (
                ['registration', 'login'].includes(flowType) ||
                (flowType === 'verification' && verifiableAddress.verified)
            ) {
                sendMessageToParent({ state: 'login-successful' });
            }
            exit();
        }
    } catch (error) {
        if (error !== 'exit') {
            die(error.message);
        }
    }
};

const parseFlowAttributes = (flowData, flowType) => {
    if (flowData.errors) {
        const msg = 'An unexpected error has occured.';
        sendMessageToParent({ action: { type: 'showMessage', variant: 'danger', text: msg } });
        console.error(flowData.errors[0].message);
        exit();
    }

    const form = document.getElementById('form') as HTMLFormElement;
    form.action = flowData.ui.action;
    form.method = flowData.ui.method;

    if (flowData.error) {
        showMessage('error', 'An unexpected error has occured.');
        die(flowData.error);
    }

    for (let i = 0; i < flowData.ui.nodes.length; i++) {
        const node = flowData.ui.nodes[i];
        if (node.attributes.name === 'csrf_token') {
            const csrfTokenHiddenInput = document.getElementById('csrf_token') as HTMLInputElement;
            csrfTokenHiddenInput.value = node.attributes.value;
        } else if (
            ['password_identifier', 'traits.email', 'email'].includes(node.attributes.name) &&
            flowType !== 'settings'
        ) {
            const elem = document.getElementById('auth_email').getElementsByTagName('input')[0];
            elem.setAttribute('name', node.attributes.name);
            if (node.attributes.value) {
                elem.value = node.attributes.value;
            }
        } else if (node.attributes.name === 'password') {
            const elem = document.getElementById('auth_password').getElementsByTagName('input')[0];
            elem.setAttribute('name', node.attributes.name);
        } else if (node.attributes.name === 'method' && node.attributes.value) {
            const submitButton = document.getElementById('submit') as HTMLButtonElement;
            submitButton.value = node.attributes.value;
            // if (flowType === 'settings' && node.attributes.value === 'password') {
            //     // Settings flow has multiple submit buttons (for email & password), we need just the password submit
            //     submitButton.value = node.attributes.value;
            // }
        }
        // Attribute-specific messages
        if (node.messages.length > 0) {
            const message = node.messages[0];
            // Field-specific messages
            if (message.id === 4000005) {
                // data breach message has the same ID :(
                if (message.text.includes('data breaches')) {
                    // The password can not be used because the password has been found in data breaches and must no longer be used.
                    // message.text = translate(
                    //     translations,
                    //     'accounts.insecure_password',
                    //     message.text,
                    // );
                } else if (message.text.includes('too similar')) {
                    // The password can not be used because the password is too similar to the user identifier.
                    // message.text = translate(
                    //     translations,
                    //     'accounts.password_too_similar_to_email',
                    //     message.text,
                    // );
                } else {
                    // The password can not be used because password length must be at least 6 characters but only got N.
                    // message.text = translate(
                    //     translations,
                    //     'accounts.password_too_short',
                    //     message.text,
                    // );
                }
            }
            showMessage(message.type, message.text);
        }
    }

    // General messages
    if (flowData.ui.messages) {
        const message = flowData.ui.messages[0];
        switch (message.id) {
            case 4000007:
                // User already registered - redirect to verification anyway
                disableForm();
                sendMessageToParent({ redirectTo: 'verification' });
                exit();
                break;

            case 4000006:
                // The provided credentials are invalid, check for spelling mistakes in your password or username, email address, or phone number.
                // message.text = translate(
                //     translations,
                //     'accounts.invalid_credentials',
                //     message.text,
                // );
                break;

            case 1060002:
                if (window.top.location.pathname !== '/account/reset-sent') {
                    disableForm();
                    sendMessageToParent({ redirectTo: 'recover' }); // "recovery mail sent" page
                    exit();
                }
                break;

            case 1050001:
                // Your changes have been saved!
                // eslint-disable-next-line no-case-declarations
                const { text } = message;
                if (flowType === 'settings') {
                    sendMessageToParent({
                        action: { type: 'showMessage', variant: 'success', text },
                    });
                    showSpinner(false);
                    exit();
                } else {
                    message.text = text;
                }
                break;

            case 4060005:
                sendMessageToParent({ action: { type: 'reload' } }); // The flow has expired - reload the page
                exit();
                break;

            case 1070001:
                // message.text = translate(
                //     translations,
                //     'accounts.recovery_email_sent',
                //     message.text,
                // );
                break;

            default:
                console.error(`Unexpected message id: ${message.id}`);
                break;
        }
        showMessage(message.type, message.text);
        sendMessageToParent({ action: { type: 'resize' } });
    }
};

const checkIsIframe = urls => {
    if (!inIframe()) {
        showSpinner(true);
        window.location.replace(urls.redirectUrl);
        exit();
    }
};

const checkPasswordLength = password => {
    if (password.length < 5) {
        showMessage('error', 'You password should be at least 5 characters long!');
        return false;
    }
    return true;
};

const checkFlowType = flowType => {
    if (['registration', 'recovery', 'settings'].includes(flowType) === false) {
        return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    if (flowType === 'registration' && urlParams.get('state') === 'success') {
        // User successfully registered - redirect to verification
        disableForm();
        sendMessageToParent({ redirectTo: 'verification' });
        exit();
    } else if (flowType === 'settings') {
        const form = document.getElementById('form');
        form.onsubmit = () => {
            sendMessageToParent({ action: { type: 'hideMessage' } }); // remove the tooltip, so it can be opened again
            return true;
        };
        return;
    } else if (flowType === 'recovery') {
        if (window.top.location.pathname === '/account/reset-sent') {
            // Remove verification re-send text & submit link-button
            document.getElementById('submit').remove();
            document.getElementById('submit_link').setAttribute('id', 'submit');
        } else {
            document.getElementById('verification').remove(); // Remove the "nothing arrived?" div
        }
    }
    const form = document.getElementById('form');
    form.onsubmit = () => {
        const passwordDiv = document.getElementById('auth_password');
        let password = '';
        if (passwordDiv) {
            // Kratos expects password input to be of type "password" (can be toggled to "text" by user to reveal it)
            passwordDiv.getElementsByTagName('input')[0].type = 'password';
            password = passwordDiv.getElementsByTagName('input')[0].value;
            if (checkPasswordLength(password) === false) {
                return false;
            }
        }
        const email = document.getElementById('auth_email').getElementsByTagName('input')[0].value;
        if (email) {
            // Save email to a temporary cookie, so we can pre-fill the email verification form field for unauthorized users.
            // This cookie will be removed in the post-vefirication page
            document.cookie = `invity_verification_email=${email}; SameSite=Lax; path=/`;
        }
        return true;
    };
};

const onEmailChange = event => {
    const submit = document.getElementById('submit') as HTMLButtonElement;
    const emailInput = document.getElementById('auth_email').getElementsByTagName('input')[0];
    const emailErrorDiv = document.getElementById('error-email');
    const passwordErrorDiv = document.getElementById('error-password');
    const re =
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    emailInput.classList.remove(...emailInput.classList);
    if (re.test(String(event.target.value).toLowerCase())) {
        emailInput.classList.add('valid-input');
        emailErrorDiv.innerText = '';
        sendMessageToParent({ action: { type: 'resize' } });
        submit.disabled = false;
        if (passwordErrorDiv && passwordErrorDiv.textContent) {
            submit.disabled = true;
        }
    } else {
        emailInput.classList.add('invalid-input');
        emailErrorDiv.innerText = 'Please, enter a valid email address';
        sendMessageToParent({ action: { type: 'resize' } });
        submit.disabled = true;
    }
};

const onPasswordChange = event => {
    const submit = document.getElementById('submit') as HTMLButtonElement;
    const passwordInput = document.getElementById('auth_password').getElementsByTagName('input')[0];
    const emailErrorDiv = document.getElementById('error-email');
    const passwordErrorDiv = document.getElementById('error-password');
    passwordInput.classList.remove(...passwordInput.classList);
    if (event.target.value.length > 6) {
        passwordInput.classList.add('valid-input');
        passwordErrorDiv.innerText = '';
        sendMessageToParent({ action: { type: 'resize' } });
        submit.disabled = false;
        if (emailErrorDiv && emailErrorDiv.textContent) {
            submit.disabled = true;
        }
    } else {
        passwordInput.classList.add('invalid-input');
        passwordErrorDiv.innerText = 'Your password is too short!';
        sendMessageToParent({ action: { type: 'resize' } });
        submit.disabled = true;
    }
};

const addInputValidation = flowType => {
    if (['login', 'registration', 'settings', 'recovery'].includes(flowType) === false) {
        return;
    }
    const emailDiv = document.getElementById('auth_email');
    if (emailDiv) {
        const emailInput = emailDiv.getElementsByTagName('input')[0];
        emailInput.addEventListener('keydown', onEmailChange);
        emailInput.addEventListener('paste', onEmailChange);
        emailInput.addEventListener('input', onEmailChange);
    }
    const passwordDiv = document.getElementById('auth_password');
    if (flowType !== 'login' && passwordDiv) {
        const passwordInput = passwordDiv.getElementsByTagName('input')[0];
        passwordInput.addEventListener('keydown', onPasswordChange);
        passwordInput.addEventListener('paste', onPasswordChange);
        passwordInput.addEventListener('input', onPasswordChange);
    }
};

const runFlow = async flowType => {
    sendMessageToParent({ action: { type: 'resize' } });
    try {
        // eslint-disable-next-line no-debugger
        const urls = getUrls(flowType);
        reloadAfterTimeout(urls, flowType);
        // checkIsIframe(urls); // If not an iframe, redirect to react UI
        checkFlowType(flowType); // Do registration & recovery-specific form changes
        // translations = await loadTranslations();
        addInputValidation(flowType);
        translateForm(flowType);
        await checkWhoami(flowType, urls); // Get user info and redirect if needed
        const flowData = await getFlowInfo(urls, flowType); // Get flowID from URL params & request form info (or get redirected)
        parseFlowAttributes(flowData, flowType); // Fill the form or show messages according to flow info
    } catch (error) {
        if (error !== 'exit') {
            console.error(error);
        }
    }
};
