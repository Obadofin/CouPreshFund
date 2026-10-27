import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ComponentProps } from 'react';
import { ColorValue } from 'react-native';
import { colors } from '../../constants/colors';

type IconName = ComponentProps<typeof Ionicons>['name'];

const tab = (title: string, icon: IconName, activeIcon: IconName) => ({
  title,
  tabBarIcon: ({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) => (
    <Ionicons name={focused ? activeIcon : icon} color={color} size={size} />
  ),
});

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.line },
      }}
    >
      <Tabs.Screen name="home" options={tab('Home', 'home-outline', 'home')} />
      <Tabs.Screen name="money" options={tab('My Money', 'wallet-outline', 'wallet')} />
      <Tabs.Screen name="growth" options={tab('My Growth', 'trending-up-outline', 'trending-up')} />
      <Tabs.Screen name="future" options={tab('My Future', 'sparkles-outline', 'sparkles')} />
      <Tabs.Screen name="profile" options={tab('Profile', 'person-outline', 'person')} />

      {/* Old screens: hidden from the tab bar until the new designs replace them */}
      <Tabs.Screen name="roadmap" options={{ href: null }} />
      <Tabs.Screen name="goals" options={{ href: null }} />
      <Tabs.Screen name="learn" options={{ href: null }} />
    </Tabs>
  );
}