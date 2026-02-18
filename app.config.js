import 'dotenv/config';

export default {
  expo: {
    name: "mall-delivery-driver",
    slug: "mall-delivery-driver",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    // ios: {
    //   supportsTablet: true,
    //   bundleIdentifier: "com.diyeddin.malldriver",
    //   config: {
    //     googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS
    //   }
    // },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.diyeddin.malldriver",
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID
        }
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-secure-store",
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow the app to use your location to navigate to customers and track deliveries."
        }
      ],
      [
        "expo-build-properties",
        {
          "android": {
            "compileSdkVersion": 35,
            "targetSdkVersion": 35,
            "buildToolsVersion": "35.0.0"
          }
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "9246990c-9c40-4f89-969a-6c74d0c4cb66"
      }
    },
    owner: "diyeddin"
  }
};