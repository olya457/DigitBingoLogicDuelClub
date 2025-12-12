import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';


export default function App() {
return (
<NavigationContainer>
<StatusBar barStyle="light-content" />
<RootNavigator />
</NavigationContainer>
);
}