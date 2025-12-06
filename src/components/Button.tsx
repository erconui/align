import React from 'react';
import { Pressable, StyleProp, Text, ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';

type Props = {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textColor?: string;
};

export default function Button({ title, onPress, style, textColor }: Props) {
  const { colors, styles } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        pressed?styles.pressableButtonPressed : styles.settingButton,
        style, // allow overrides
      ]}
    >
      <Text style={{ color: colors.text ?? '#fff', fontWeight: '500', textAlign:'center' }}>
        {title}
      </Text>
    </Pressable>
  );
}