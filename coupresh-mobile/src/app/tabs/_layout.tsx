import { Tabs } from 'expo-router';
import { House, LucideIcon, Sparkles, TrendingUp, User, Wallet } from 'lucide-react-native';
import { ColorValue } from 'react-native';
import { colors } from '../../constants/colors';

const tab = (title: string, Icon: LucideIcon) => ({
  title,
  tabBarIcon: ({ color, size }: { color: ColorValue; size: number }) => (
    <Icon color={color as string} size={size} strokeWidth={1.8} />
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
      <Tabs.Screen name="home" options={tab('Home', House)} />
      <Tabs.Screen name="money" options={tab('My Money', Wallet)} />
      <Tabs.Screen name="growth" options={tab('My Growth', TrendingUp)} />
      <Tabs.Screen name="future" options={tab('My Future', Sparkles)} />
      <Tabs.Screen name="profile" options={tab('Profile', User)} />

      {/* Old screens: hidden from the tab bar until the new designs replace them */}
      <Tabs.Screen name="roadmap" options={{ href: null }} />
      <Tabs.Screen name="goals" options={{ href: null }} />
      <Tabs.Screen name="learn" options={{ href: null }} />
    </Tabs>
  );
}