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

// Helper function to find and elevate Windows Hello dialog
HWND FindAndElevateHelloWindow() {
    HWND helloWindow = FindWindowW(L"Credential Dialog Xaml Host", NULL);
    if (helloWindow != NULL && IsWindow(helloWindow)) {
        // Make it topmost and bring to foreground
        SetWindowPos(helloWindow, HWND_TOPMOST, 0, 0, 0, 0, 
                    SWP_NOMOVE | SWP_NOSIZE | SWP_SHOWWINDOW);
        
        // Force the window to be the foreground window
        // First, get the foreground window to check if we're already in foreground
        HWND foregroundWindow = GetForegroundWindow();
        if (foregroundWindow != helloWindow) {
            // Try multiple focus techniques
            
            // 1. Basic foreground window setting
            SetForegroundWindow(helloWindow);
            
            // 2. Thread attachment technique for input focus
            DWORD currentThreadId = GetCurrentThreadId();
            DWORD windowThreadId = GetWindowThreadProcessId(helloWindow, NULL);
            if (AttachThreadInput(currentThreadId, windowThreadId, TRUE)) {
                // Activate and focus
                BringWindowToTop(helloWindow);
                SetActiveWindow(helloWindow);
                SetFocus(helloWindow);
                AttachThreadInput(currentThreadId, windowThreadId, FALSE);
            }
            
            // 3. Try simulating Alt key press which can help with focus
            keybd_event(VK_MENU, 0, 0, 0);                // Alt press
            SetForegroundWindow(helloWindow);             // Set foreground
            keybd_event(VK_MENU, 0, KEYEVENTF_KEYUP, 0); // Alt release
            
            // 4. Force update of window
            UpdateWindow(helloWindow);
            
            // 5. Try to disable then re-enable the window to force focus
            EnableWindow(helloWindow, FALSE);
            EnableWindow(helloWindow, TRUE);
            
            // 6. Try to flash the window to get user attention
            FLASHWINFO fi;
            fi.cbSize = sizeof(FLASHWINFO);
            fi.hwnd = helloWindow;
            fi.dwFlags = FLASHW_ALL | FLASHW_TIMERNOFG;
            fi.uCount = 3;
            fi.dwTimeout = 0;
            FlashWindowEx(&fi);
        }
        
        return helloWindow;
    }
    return NULL;
}

Napi::String requestHello(const Napi::CallbackInfo& info) {
    try {
        std::string message = "Verify your identity";
        if (info.Length() > 0 && info[0].IsString()) {
            message = info[0].As<Napi::String>();
        }
        
        HWND parentWindow = NULL;
        if (info.Length() > 1 && !info[1].IsNull() && !info[1].IsUndefined()) {
            if (info[1].IsBuffer()) {
                Napi::Buffer<uint8_t> handleBuffer = info[1].As<Napi::Buffer<uint8_t>>();
                if (handleBuffer.Length() >= sizeof(HWND)) {
                    parentWindow = *reinterpret_cast<HWND*>(handleBuffer.Data());
                    
                    if (!IsWindow(parentWindow)) {
                        parentWindow = NULL;
                    }
                }
            }
        }
        
        winrt::hstring promptMessage = winrt::to_hstring(message);
        std::string resultString = "Error";
        std::atomic<bool> threadCompleted(false);
        std::exception_ptr threadException = nullptr;
        
        // Always enable foreground window switching
        AllowSetForegroundWindow(ASFW_ANY);
        
        if (parentWindow != NULL && IsWindow(parentWindow)) {
            ShowWindow(parentWindow, SW_RESTORE);
            SetWindowPos(parentWindow, HWND_NOTOPMOST, 0, 0, 0, 0, 
                        SWP_NOMOVE | SWP_NOSIZE | SWP_SHOWWINDOW | SWP_ASYNCWINDOWPOS);
            Sleep(100);
        }
        
        // Create a flag to signal the window monitor thread to stop
        std::atomic<bool> stopWindowMonitor(false);
        
        // Start a thread to continuously monitor and elevate the Windows Hello dialog
        std::thread windowMonitorThread([&stopWindowMonitor]() {
            // Wait a bit for the dialog to appear
            Sleep(500);
            
            // Keep checking for the Windows Hello dialog and elevating it
            while (!stopWindowMonitor) {
                FindAndElevateHelloWindow();
                Sleep(100); // Check every 100ms
            }
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
        
        // Signal the window monitor thread to stop and wait for it to finish
        stopWindowMonitor = true;
        windowMonitorThread.join();
        
        // Final attempt to elevate the Windows Hello dialog
        FindAndElevateHelloWindow();
        
        // Also handle the parent window if it exists
        if (parentWindow != NULL && IsWindow(parentWindow)) {
            SetWindowPos(parentWindow, HWND_TOP, 0, 0, 0, 0, 
                        SWP_NOMOVE | SWP_NOSIZE | SWP_SHOWWINDOW | SWP_ASYNCWINDOWPOS);
            SetForegroundWindow(parentWindow);
        }
        
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


