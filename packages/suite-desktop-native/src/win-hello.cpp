#include <napi.h>
#include <Windows.h>
#include <string>
#include <thread>
#include <mutex>
#include <atomic>
#include <future>
#include <chrono>
#include <winrt/Windows.Foundation.h>
#include <winrt/Windows.Security.Credentials.UI.h>

#pragma comment(lib, "runtimeobject.lib")
#pragma comment(lib, "ole32.lib")

using namespace winrt;
using namespace Windows::Security::Credentials::UI;
using namespace std::chrono;

Napi::Value isHelloAvailable(const Napi::CallbackInfo& info) {
    try {
        std::atomic<bool> isAvailable(false);
        std::atomic<bool> threadCompleted(false);
        std::exception_ptr threadException = nullptr;
        std::string errorMessage;
        UserConsentVerifierAvailability availabilityStatus = UserConsentVerifierAvailability::DeviceNotPresent;

        std::thread staThread([&isAvailable, &threadCompleted, &threadException, &errorMessage, &availabilityStatus]() {
            try {
                winrt::init_apartment(winrt::apartment_type::single_threaded);
                availabilityStatus = UserConsentVerifier::CheckAvailabilityAsync().get();
                isAvailable = (availabilityStatus == UserConsentVerifierAvailability::Available);

                if (!isAvailable) {
                    switch (availabilityStatus) {
                        case UserConsentVerifierAvailability::DeviceNotPresent:
                            errorMessage = "Windows Hello hardware is not present on this device";
                            break;
                        case UserConsentVerifierAvailability::NotConfiguredForUser:
                            errorMessage = "Windows Hello is not configured for the current user";
                            break;
                        case UserConsentVerifierAvailability::DisabledByPolicy:
                            errorMessage = "Windows Hello is disabled by policy";
                            break;
                        default:
                            errorMessage = "Windows Hello is not available on this system";
                            break;
                    }
                }

                winrt::uninit_apartment();
                threadCompleted = true;
            }
            catch (const winrt::hresult_error& ex) {
                errorMessage = winrt::to_string(ex.message());
                threadException = std::current_exception();
                try { winrt::uninit_apartment(); } catch (...) {}
            }
            catch (const std::exception& ex) {
                errorMessage = ex.what();
                threadException = std::current_exception();
                try { winrt::uninit_apartment(); } catch (...) {}
            }
            catch (...) {
                errorMessage = "Unknown error occurred while checking Windows Hello availability";
                threadException = std::current_exception();
                try { winrt::uninit_apartment(); } catch (...) {}
            }
        });

        staThread.join();

        if (!threadCompleted) {
            Napi::Error::New(info.Env(), "Thread did not complete successfully").ThrowAsJavaScriptException();
            return info.Env().Undefined();
        }

        if (!isAvailable) {
            Napi::Error::New(info.Env(), errorMessage).ThrowAsJavaScriptException();
            return info.Env().Undefined();
        }

        return Napi::Boolean::New(info.Env(), true);
    }
    catch (const winrt::hresult_error& ex) {
        Napi::Error::New(info.Env(), std::string("WinRT Error: ") + winrt::to_string(ex.message())).ThrowAsJavaScriptException();
        return info.Env().Undefined();
    }
    catch (const std::exception& ex) {
        Napi::Error::New(info.Env(), std::string("Error: ") + ex.what()).ThrowAsJavaScriptException();
        return info.Env().Undefined();
    }
    catch (...) {
        Napi::Error::New(info.Env(), "Unknown error occurred").ThrowAsJavaScriptException();
        return info.Env().Undefined();
    }
}

Napi::String requestHello(const Napi::CallbackInfo& info) {
    try {
        std::string message = "Verify your identity";
        if (info.Length() > 0 && info[0].IsString()) {
            message = info[0].As<Napi::String>();
        }

        winrt::hstring promptMessage = winrt::to_hstring(message);
        std::string resultString = "Error";
        std::atomic<bool> threadCompleted(false);
        std::exception_ptr threadException = nullptr;

        // Grant broad permission for any other process to bring its window to the front, because the Windows Hello dialog
        // is created by a different process and needs to be able to set itself as the foreground window to receive user input.
        AllowSetForegroundWindow(ASFW_ANY);

        // Bring the Windows Hello dialog to front once it appears.
        // Because this code runs inside a child process (not the foreground
        // process), Windows blocks ordinary SetForegroundWindow calls.
        // The keybd_event Alt-key trick is the standard workaround: it makes
        // Windows believe this process is handling user input, which lifts the
        // foreground lock.
        std::thread foregroundThread([]() {
            HWND helloWindow = NULL;
            // Effectively a 5-second timeout waiting for the dialog to appear, else nothing happens. The dialog is usually very fast to appear.
            for (int i = 0; i < 50; i++) {
                Sleep(100);
                helloWindow = FindWindowW(L"Credential Dialog Xaml Host", NULL);
                if (helloWindow != NULL && IsWindow(helloWindow) && IsWindowVisible(helloWindow)) {
                    break;
                }
            }
            if (helloWindow == NULL) return;

            // Let the dialog fully initialise its input controls
            Sleep(300);

            // Simulate Alt press/release – this is consumed by the window
            // manager and allows the subsequent SetForegroundWindow to succeed
            // even from a background process. It does NOT inject a character
            // into the PIN field.
            keybd_event(VK_MENU, 0, 0, 0);
            keybd_event(VK_MENU, 0, KEYEVENTF_KEYUP, 0);

            // Use HWND_TOPMOST to bring above Electron.
            SetWindowPos(helloWindow, HWND_TOPMOST, 0, 0, 0, 0,
                        SWP_NOMOVE | SWP_NOSIZE);
            Sleep(50);
            SetWindowPos(helloWindow, HWND_NOTOPMOST, 0, 0, 0, 0,
                        SWP_NOMOVE | SWP_NOSIZE);

            // Final SetForegroundWindow to ensure the dialog has proper
            // foreground status and keyboard focus after Z-order change
            if (!SetForegroundWindow(helloWindow)) {
                return;
            }

            // Simulate a Tab key press to move focus into the PIN input
            // field if it is present in the dialog, but only after the
            // dialog actually becomes the foreground window.
            Sleep(50);
            if (GetForegroundWindow() != helloWindow) {
                return;
            }

            keybd_event(VK_TAB, 0, 0, 0);
            keybd_event(VK_TAB, 0, KEYEVENTF_KEYUP, 0);
        });

        std::thread staThread([promptMessage, &resultString, &threadCompleted, &threadException]() {
            try {
                winrt::init_apartment(winrt::apartment_type::single_threaded);
                auto availabilityResult = UserConsentVerifier::CheckAvailabilityAsync().get();

                if (availabilityResult != UserConsentVerifierAvailability::Available) {
                    switch (availabilityResult) {
                        case UserConsentVerifierAvailability::DeviceNotPresent:
                            resultString = "DeviceNotPresent";
                            break;
                        case UserConsentVerifierAvailability::NotConfiguredForUser:
                            resultString = "NotConfiguredForUser";
                            break;
                        case UserConsentVerifierAvailability::DisabledByPolicy:
                            resultString = "DisabledByPolicy";
                            break;
                        default:
                            resultString = "NotAvailable";
                            break;
                    }
                }
                else {
                    UserConsentVerificationResult verificationResult =
                        UserConsentVerifier::RequestVerificationAsync(promptMessage).get();

                    switch (verificationResult) {
                        case UserConsentVerificationResult::Verified:
                            resultString = "Success";
                            break;
                        case UserConsentVerificationResult::DeviceNotPresent:
                            resultString = "DeviceNotPresent";
                            break;
                        case UserConsentVerificationResult::NotConfiguredForUser:
                            resultString = "NotConfiguredForUser";
                            break;
                        case UserConsentVerificationResult::DisabledByPolicy:
                            resultString = "DisabledByPolicy";
                            break;
                        case UserConsentVerificationResult::DeviceBusy:
                            resultString = "DeviceBusy";
                            break;
                        case UserConsentVerificationResult::RetriesExhausted:
                            resultString = "RetriesExhausted";
                            break;
                        case UserConsentVerificationResult::Canceled:
                            resultString = "Canceled";
                            break;
                        default:
                            resultString = "Error";
                            break;
                    }
                }

                winrt::uninit_apartment();
                threadCompleted = true;
            }
            catch (const winrt::hresult_error& ex) {
                try { winrt::uninit_apartment(); } catch (...) {}
                threadException = std::current_exception();
            }
            catch (...) {
                try { winrt::uninit_apartment(); } catch (...) {}
                threadException = std::current_exception();
            }
        });

        staThread.join();
        foregroundThread.join();

        if (threadException) {
            try {
                std::rethrow_exception(threadException);
            }
            catch (const winrt::hresult_error& ex) {
                return Napi::String::New(info.Env(), std::string("Error: ") + winrt::to_string(ex.message()));
            }
            catch (const std::exception& ex) {
                return Napi::String::New(info.Env(), std::string("Error: ") + ex.what());
            }
            catch (...) {
                return Napi::String::New(info.Env(), "Unknown error");
            }
        }

        if (!threadCompleted) {
            return Napi::String::New(info.Env(), "Thread did not complete successfully");
        }

        return Napi::String::New(info.Env(), resultString);
    }
    catch (const std::exception& ex) {
        return Napi::String::New(info.Env(), std::string("Error: ") + ex.what());
    }
    catch (...) {
        return Napi::String::New(info.Env(), "Unknown error");
    }
}


