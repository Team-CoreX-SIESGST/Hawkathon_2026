import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/HomeScreen";
import ChatScreen from "../screens/ChatScreen";
import LoginScreen from "../screens/LoginScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SplashScreen from "../screens/SplashScreen";
import RoleSelectionScreen from "../screens/RoleSelectionScreen";
import AuthChoiceScreen from "../screens/AuthChoiceScreen";
import AuthFormScreen from "../screens/AuthFormScreen";
import PatientDashboardMock from "../screens/PatientDashboardMock";
import ConsultantDashboardMock from "../screens/ConsultantDashboardMock";
import DoctorProfilePage from "../screens/DoctorProfilePage";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RoleSelection"
          component={RoleSelectionScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AuthChoice"
          component={AuthChoiceScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AuthForm"
          component={AuthFormScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen
          name="PatientDashboardMock"
          component={PatientDashboardMock}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ConsultantDashboardMock"
          component={ConsultantDashboardMock}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="DoctorProfile"
          component={DoctorProfilePage}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
