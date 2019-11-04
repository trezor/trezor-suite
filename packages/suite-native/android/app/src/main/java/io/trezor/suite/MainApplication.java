package io.trezor.suite;

import android.app.Application;
import android.content.Context;
import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.soloader.SoLoader;

import java.util.Arrays;
import java.lang.reflect.InvocationTargetException;
import java.util.List;

// https://github.com/react-native-community/react-native-svg#android
import com.horcrux.svg.SvgPackage;
import io.sentry.RNSentryPackage;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      List<ReactPackage> packages = new PackageList(this).getPackages();
      packages.add(
        new SvgPackage(),
        new RNSentryPackage()
      );
      return packages;
    }

    @Override
    protected String getJSMainModuleName() {
      return "packages/suite-native/index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
