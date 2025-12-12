import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import LoaderScreen from '../screens/LoaderScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import MainScreen from '../screens/MainScreen';
import SoloLogicRunScreen from '../screens/SoloLogicRunScreen';
import FriendDuelModeScreen from '../screens/FriendDuelModeScreen';
import RecordsScreen from '../screens/RecordsScreen';
import RulesScreen from '../screens/RulesScreen';
import SettingsScreen from '../screens/SettingsScreen';


const Stack = createNativeStackNavigator<RootStackParamList>();


export default function RootNavigator() {
return (
<Stack.Navigator initialRouteName="Loader" screenOptions={{ headerShown: false }}>
<Stack.Screen name="Loader" component={LoaderScreen} />
<Stack.Screen name="Onboarding" component={OnboardingScreen} />
<Stack.Screen name="Main" component={MainScreen} />
<Stack.Screen name="SoloLogicRun" component={SoloLogicRunScreen} />
<Stack.Screen name="FriendDuelMode" component={FriendDuelModeScreen} />
<Stack.Screen name="Records" component={RecordsScreen} />
<Stack.Screen name="Rules" component={RulesScreen} />
<Stack.Screen name="Settings" component={SettingsScreen} />
</Stack.Navigator>
);
}