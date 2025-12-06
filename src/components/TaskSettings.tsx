import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Animated,
  Button,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';

const SCREEN_WIDTH = Dimensions.get('window').width;

type SettingsDrawerProps = {
  children: React.ReactNode;
  drawerWidth?: number;
  drawerPosition?: 'left' | 'right';
  backdropColor?: string;
};
type SettingsDrawerHandle = {
  open: () => void;
  close: () => void;
};
const SettingsDrawer = forwardRef<SettingsDrawerHandle, SettingsDrawerProps>(
  (
    {
      children,
      drawerWidth = 300,
      drawerPosition = 'right',
      backdropColor = 'rgba(0,0,0,0.4)',
    },
    ref
  ) => {
    const [visible, setVisible] = useState(false);
    const translateX = useRef(new Animated.Value(drawerPosition === 'left' ? -drawerWidth : drawerWidth)).current;
    const insets = useSafeAreaInsets();
    const { colors, styles } = useTheme();
    
    const close = () => {
      if(ref) {
        (ref as React.RefObject<SettingsDrawerHandle>).current?.close();
      }
    };

    // Ensure translateX resets when reopening
    useEffect(() => {
      if (visible) {
        translateX.setValue(drawerPosition === 'left' ? -drawerWidth : drawerWidth);
      }
    }, [visible, drawerWidth, drawerPosition]);

    useImperativeHandle(ref, () => ({
      open: () => {
        setVisible(true);
        requestAnimationFrame(() => {
          // Animate after modal is rendered
          Animated.timing(translateX, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }).start();
        });
      },
      close: () => {
        Animated.timing(translateX, {
          toValue: drawerPosition === 'left' ? -drawerWidth : drawerWidth,
          duration: 250,
          useNativeDriver: true,
        }).start(() => setVisible(false));
      },
    }));

    return (
      <Modal visible={visible} transparent animationType="none">
        <TouchableWithoutFeedback onPress={close}>
          <View style={[styles.backdrop, { backgroundColor: backdropColor }]} />
        </TouchableWithoutFeedback>
        <Animated.View
          style={[
            styles.drawer,
            {
              width: drawerWidth,
              transform: [{ translateX }],
              [drawerPosition]: 0,
              marginTop: insets.top,
            },
          ]}
        >
          {children}
          <Button title="Close" onPress={close} />
        </Animated.View>
      </Modal>
    );
  }
);

export default SettingsDrawer;
