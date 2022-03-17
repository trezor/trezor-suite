// TODO: core.js -> core.ts
/** Adds checkbox click event listeners. Checkbox is a div element (not input type="checkbox"). */
function addCheckboxClickEventListeners() {
    const checkboxControl = document.querySelector('.checkbox-control');
    const checkbox = document.querySelector('.checkbox');
    const checkboxCheckedIcon = document.querySelector('.checkbox-checked-icon');
    const checkboxInput = document.querySelector('.checkbox-input');
    const handleCheckboxClick = () => {
        checkbox?.classList.toggle('checked');
        checkbox?.classList.toggle('unchecked');
        checkboxCheckedIcon?.classList.toggle('hidden', checkbox?.classList.contains('unchecked'));
        checkboxInput.checked = !checkbox?.classList.contains('unchecked');
    };
    checkboxControl?.addEventListener('click', handleCheckboxClick);
}

const InvityAuthenticationThemeKey = 'invity-authentication-theme';
/** Ensures dark mode class is applied to document.body if needed. */
function ensureTheme() {
    // NOTE: Need to store applied theme to storage, because we know the theme only on first page load. There are 2-3 page loads.
    const searchParams = new URLSearchParams(document.location.search);
    let themeEffective = searchParams.get(InvityAuthenticationThemeKey);
    if (!themeEffective) {
        themeEffective = sessionStorage.getItem(InvityAuthenticationThemeKey);
    } else {
        sessionStorage.setItem(InvityAuthenticationThemeKey, themeEffective);
    }
    if (themeEffective === 'dark') {
        document.body.classList.add(themeEffective);
    }
}

function ensureInputFocus() {
    // NOTE: Without setTimeout the focus does not work.
    window.setTimeout(() => {
        document.querySelector('#email')?.focus();
    }, 100);
}

let passwordIsVisible = false;

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('auth_password').getElementsByTagName('input')[0];
    if (passwordIsVisible) {
        passwordInput.type = 'password';
    } else {
        passwordInput.type = 'text';
    }
    passwordIsVisible = !passwordIsVisible;
    document
        .getElementById('eye')
        .style.setProperty('display', passwordIsVisible ? 'none' : 'initial');
    document
        .getElementById('eye-off')
        .style.setProperty('display', !passwordIsVisible ? 'none' : 'initial');
}

window.addEventListener('DOMContentLoaded', _ => {
    addCheckboxClickEventListeners();
    ensureTheme();
    ensureInputFocus();
});
