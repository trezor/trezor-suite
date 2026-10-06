#include <napi.h>

// Function declarations from win-hello.cpp
Napi::Value isHelloAvailable(const Napi::CallbackInfo& info);
Napi::String requestHello(const Napi::CallbackInfo& info);

// Initialize all functions
Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("isHelloAvailable", Napi::Function::New(env, isHelloAvailable));
  exports.Set("requestHello", Napi::Function::New(env, requestHello));
  return exports;
}

// Register and initialize native add-on
NODE_API_MODULE(win_hello, Init)
