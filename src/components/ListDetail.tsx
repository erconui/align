import { Ionicons } from '@expo/vector-icons';
import React, { useState } from "react";
import { FlatList, Modal, Pressable, Switch, Text, TextInput, View } from "react-native";
import { useTheme } from "../hooks/useTheme";

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ListParams, TaskTemplate } from "../types";

interface Props {
  task: TaskTemplate | null;
  parent: TaskTemplate | null;
  instances: string[] | null;
  onSave: (updated: ListParams) => void;
  onClose: () => void;
}

export default function ListDetail({ task, parent, instances, onSave, onClose }: Props) {
  if (!task) {
    return '';
  }
  // Basic fields
  const [title, setTitle] = useState(task.title);
  const [privateList, setPrivateList] = useState(task.private);
  const isRoot = parent?false:true;
  const hasRoot = instances?.includes("");
  const [rootLevel, setRootLevel] = useState(hasRoot || isRoot);
  const [ unlink, setUnlink ] = useState(false);
  const { colors, styles, toggleTheme, theme } = useTheme();
  const parents = instances?.filter(i => i !== "" && (parent?!i.endsWith(parent?.title):true));
  if (hasRoot && parent) {
    parents?.unshift("Root");
  }
  const rootRemovable = parents?parents.length > 0:false;
  const canUnlink = instances?instances.length > 1:false;
  // console.log('test', instances);
  const insets = useSafeAreaInsets();

  const save = () => {
    const updated: ListParams = {
      id: task.id,
      title:title,
      updated_at: new Date().toISOString(),
      private: privateList,
      parent_id: parent?.id || null
    };
    // console.log(isRoot, hasRoot, rootLevel, rootRemovable);
    if ((!rootLevel && rootRemovable) || ( rootLevel && !isRoot && !hasRoot )) {
      updated.rootLevel = rootLevel;
    }
    if (canUnlink && unlink) {
      updated.unlink = unlink;
    }

    // console.log(updated);

    onSave(updated);
    onClose();
  };

  return (
    <Modal 
      animationType="slide"
      transparent>
      <View style={{ flex: 1, backgroundColor: colors.background, marginTop: insets.top, marginBottom: insets.bottom }}>

      {/* Title */}
      <View style={{...styles.settingsRow, justifyContent:'center'}}>
        <Pressable onPress={onClose} style={{justifyContent:'center'}}>
            <Ionicons name="chevron-back" size={24} style={{...styles.headerText, marginBottom: 0, color: colors.buttonBorder, fontSize: 36}} /></Pressable>
        <Text style={{...styles.headerText, marginBottom:0}}>Title: </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          style={styles.input}
          // style={{ padding: 8, borderWidth: 1, borderRadius: 8 }}
        />
      </View>
      <View style={styles.settingsRow}>
        <Text style={styles.settingText}>Parent</Text>
        <Text style={{...styles.settingText, textAlign:'right'}}>{parent?parent.title:"Root"}</Text>
      </View>

      {/* Private */}
      <View style={styles.settingsRow}>
        <Text style={styles.settingText}>Private</Text>
        <Switch value={privateList} onValueChange={setPrivateList} />
      </View>
      
      { (!hasRoot || rootRemovable) && (<View style={styles.settingsRow}>
        <Text style={styles.settingText}>Root level</Text>
        <Switch value={rootLevel} onValueChange={setRootLevel} />
      </View>)}

      { parents && parents.length > 0?(
        <View style={{flex: 1}}>
          <View style={{...styles.settingsRow, borderBottomWidth:0}}>
            <Text style={styles.settingText}>Unlink from other instances</Text>
            <Switch value={unlink} onValueChange={setUnlink} />
          </View>

          <FlatList
            data={parents}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingVertical: 10 }}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <Text style={styles.input}>{item}</Text>
            )}
          />
        </View>
      ):null}
      
      {/* Save */}
      <Pressable
        onPress={save} style={styles.pressableButton}
        // style={{
        //   padding: 12,
        //   borderRadius: 8,
        //   backgroundColor: "#0084ff",
        //   marginTop: 24,
        // }}
      >
        <Text style={styles.buttonText}>
          Save Changes
        </Text>
      </Pressable>
      </View>
    </Modal>
  );
}