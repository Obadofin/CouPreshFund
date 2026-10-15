import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ComponentProps } from 'react';
import { ColorValue } from 'react-native';
import { colors } from '../../constants/colors';

type IconName = ComponentProps<typeof Ionicons>['name'];

const tab = (title: string, icon: IconName) => ({
  title,
  tabBarIcon: ({ color, size }: { color: ColorValue; size: number }) => (
    <Ionicons name={icon} color={color} size={size} />
  ),
});

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.text,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
      }}
    >
      <Tabs.Screen name="home" options={tab('Home', 'home')} />
      <Tabs.Screen name="roadmap" options={tab('Roadmap', 'map-outline')} />
      <Tabs.Screen name="goals" options={tab('Goals', 'flag-outline')} />
      <Tabs.Screen name="learn" options={tab('Learn', 'book-outline')} />
    </Tabs>
  );
}