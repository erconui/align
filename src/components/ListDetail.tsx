import { Ionicons } from '@expo/vector-icons';
import React, { useState } from "react";
import { FlatList, Modal, Pressable, Switch, Text, TextInput, View } from "react-native";
import { useTheme } from "../hooks/useTheme";

import type { TaskParams, TaskTemplate } from "../types";

interface Props {
  task: TaskTemplate | null;
  instances: string[] | null;
  onSave: (updated: TaskParams) => void;
  onClose: () => void;
}

export default function ListDetail({ task, instances, onSave, onClose }: Props) {
  if (!task) {
    return '';
  }
  // Basic fields
  const [title, setTitle] = useState(task.title);
  const [privateList, setPrivateList] = useState(task.private);
  const [rootLevel, setRootLevel] = useState(false);
  const { colors, styles, toggleTheme, theme } = useTheme();
  console.log(instances);

  const save = () => {
    // console.log('save rule',rule);
    // const updated: TaskParams = {
    //   id: task.id,
    //   template_id: task.template_id,
    //   parent_id: task.parent_id,
    //   title:title,
    //   completed: task.completed,
    //   completed_at: task.completed_at,
    //   due_date: dueDate ? dueDate.toISOString() : null,
    //   created_at: task.created_at,
    //   updated_at: new Date().toISOString(),
    //   recurrence_rule_id: task.recurrence_rule_id,
    //   recurrence: rule,
    //   position: task.position,
    //   expanded: task.expanded,
    //   private: privateList,
    // };

    // onSave(updated);
    onClose();
  };

  return (
    <Modal 
      animationType="slide"
      presentationStyle="pageSheet"
      style={{ marginTop:60, paddingTop: 30}}>
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: 30 }}>

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

      {/* Private */}
      <View style={styles.settingsRow}>
        <Text style={styles.settingText}>Private</Text>
        <Switch value={privateList} onValueChange={setPrivateList} />
      </View>
      
      <View style={styles.settingsRow}>
        <Text style={styles.settingText}>Root level</Text>
        <Switch value={rootLevel} onValueChange={setRootLevel} />
      </View>

      { instances?(
        <View style={{flex: 1}}>
          <View style={{...styles.settingsRow, borderBottomWidth:0}}>
            <Text style={styles.settingText}>Instances of list</Text>
            <Switch value={privateList} onValueChange={setPrivateList} />
            <Pressable onPress={() => console.log('unlink')} style={styles.settingButton}>
              <Text>
                Unlink
              </Text>
            </Pressable>
          </View>

          <FlatList
            data={instances}
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