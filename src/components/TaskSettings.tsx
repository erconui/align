import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import {
  View,
  Modal,
  Animated,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

const SettingsDrawer = forwardRef(
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
        <TouchableWithoutFeedback onPress={() => ref.current.close()}>
          <View style={[styles.backdrop, { backgroundColor: backdropColor }]} />
        </TouchableWithoutFeedback>
        <Animated.View
          style={[
            styles.drawer,
            {
              width: drawerWidth,
              transform: [{ translateX }],
              [drawerPosition]: 0,
            },
          ]}
        >
          {children}
        </Animated.View>
      </Modal>
    );
  }
);

export default SettingsDrawer;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
});