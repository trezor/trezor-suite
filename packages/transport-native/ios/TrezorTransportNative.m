#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(TrezorTransportNative, NSObject)

RCT_EXTERN_METHOD(multiply:(float)a withB:(float)b
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

// https://github.com/facebook/react-native/issues/23755#issuecomment-474235632
+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
