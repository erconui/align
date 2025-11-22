import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import React, { useState } from "react";
import { Modal, Pressable, Switch, Text, TextInput, View } from "react-native";
import { useTheme } from "../hooks/useTheme";

import type { TaskInstance } from "../types";

export interface RecurrenceRule {
  type: "none" | "daily" | "weekly" | "monthly" | "yearly" | "custom";
  interval?: number;
  days_of_week?: number[];
  catch_up?: boolean;
}

interface Props {
  task: TaskInstance;
  onSave: (updated: TaskInstance) => void;
  onClose: () => void;
  visible: boolean;
}

export default function TaskDetail({ task, onSave, onClose }: Props) {
  if (!task) {
    return '';
  }
  task = {
  id: task.id,
  template_id: task.template_id,
  parent_id: task.parent_id,
  title: 'TEST',
  completed: false,
  completed_at: null,
  due_date: null,
  created_at: "08/09/2025",
  updated_at: null,
  recurrence_rule: JSON.stringify({type:'none'}),
  position: 2,
  expanded: true,
  private: true

  }
  // Basic fields
  const [title, setTitle] = useState(task.title);
  const [privateTask, setPrivateTask] = useState(task.private);
  const [skipIfMissed, setSkippedIfMissed] = useState(false);
  const [dueDate, setDueDate] = useState(
    task.due_date ? new Date(task.due_date) : null
  );
  const [showDuePicker, setShowDuePicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const { colors, styles, toggleTheme, theme } = useTheme();
  const [endType, setEndType] = useState<"never" | "on" | "after">("never");
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [occurrences, setOccurrences] = useState("");
  // Recurrence rule (parsed)
  const initialRule: RecurrenceRule = task.recurrence_rule
    ? JSON.parse(task.recurrence_rule)
    : { type: "none" };

  const [rule, setRule] = useState<RecurrenceRule>(initialRule);

  const toggleDay = (day: number) => {
    const current = rule.days_of_week ?? [];
    const next = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day];

    setRule({ ...rule, days_of_week: next });
  };

  const save = () => {
    const updated: TaskInstance = {
      ...task,
      title,
      private: privateTask,
      due_date: dueDate ? dueDate.toISOString() : null,
      recurrence_rule: rule.type === "none" ? null : JSON.stringify(rule),
      updated_at: new Date().toISOString(),
    };

    onSave(updated);
  };

  return (
    <Modal >
      <View style={{ flex: 1, backgroundColor: colors.background }}>

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

      {/* Due Date */}
      <View style={styles.detailRow}>
        <Text style={styles.settingText}>Due Date</Text>
        <Pressable onPress={() => setShowDuePicker(true)} style={styles.settingButton}>
          <Text>
            {dueDate ? dueDate.toDateString() : "Select Due Date"}
          </Text>
        </Pressable>
        {/* {dueDate && (
          <Text>{dueDate.toDateString()}</Text>
        )} */}
        {(showDuePicker || showEndPicker) &&(
        <DateTimePicker
          value={(showDuePicker?dueDate:endDate) ?? new Date()}
          onChange={(e, v) => {
            if (showDuePicker) {
              setShowDuePicker(false);
            } else {
              setShowEndPicker(false);
            }
            if(v) {
              if (showDuePicker){
                setDueDate(v);
              } else {
                setEndDate(v);
              }
            }
          }}
          mode="date"
        />)}
      </View>

      {/* Recurrence */}
      <View style={styles.detailContainer}>
        <View style={{...styles.detailRow, borderBottomWidth:0}}>
          <Text style={styles.settingText}>Repeat</Text>
          <Picker
          style={{...styles.detailButton,width: 150, height:50}}
            selectedValue={rule.type}
            onValueChange={(v) => setRule({ ...rule, type: v })}
          >
            <Picker.Item label="None" value="none" />
            <Picker.Item label="Daily" value="daily" />
            <Picker.Item label="Weekly" value="weekly" />
            <Picker.Item label="Monthly" value="monthly" />
            <Picker.Item label="Yearly" value="yearly" />
            <Picker.Item label="Custom…" value="custom" />
          </Picker>
        </View>
      {/* Weekly or custom days */}
      {(rule.type === "weekly" || rule.type === "custom") && (
        <View style={{...styles.detailRow, flexDirection:'column', borderBottomWidth:0}}>
          <Text style={styles.settingText}>Days of Week</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, idx) => {
              const selected = rule.days_of_week?.includes(idx);
              return (
                <Pressable
                  key={idx}
                  onPress={() => toggleDay(idx)}
                  style = {styles.pressableButton}
                  // style={{
                  //   padding: 8,
                  //   borderWidth: 1,
                  //   borderRadius: 6,
                  //   backgroundColor: selected ? "#ddd" : "#fff",
                  // }}
                >
                  <Text>{d}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Interval */}
      {(rule.type !== "none" && rule.type !== "daily") && (
        <View style={{...styles.detailRow, borderBottomWidth:0}}>
          <Text style={{color:colors.text}}>Every N {rule.type === "weekly" ? "weeks" : rule.type + "s"}</Text>
          <TextInput
            keyboardType="numeric"
            value={String(rule.interval ?? 1)}
            onChangeText={(txt) =>
              setRule({ ...rule, interval: Number(txt) || 1 })
            }
            // style={{...styles.input, padding: 8, borderWidth: 1, borderRadius: 8 }}
            style={styles.input}
          />
        </View>
      )}
      {(rule.type !== "none") && (
        <View>
          <Text style={styles.settingText}>Ends:</Text>

          {/* NEVER */}
            <Pressable 
              onPress={() => setEndType("never")} 
              style={styles.radioRow}
            >
              <View style={[styles.radioDot, endType === "never" && styles.radioDotSelected]} />
              <Text style={{color: colors.text}}>Never</Text>
            </Pressable>

            {/* ON DATE */}
            <Pressable 
              onPress={() => setEndType("on")} 
              style={styles.radioRow}
            >
              <View style={[styles.radioDot, endType === "on" && styles.radioDotSelected]} />
              <Text style={{color: colors.text, marginRight: 6}}>On</Text>

              <Pressable
                disabled={endType !== "on"}
                onPress={() => setShowEndPicker(true)}
                style={[
                  styles.settingButton,
                  endType !== "on" && {opacity: 0.3}
                ]}
              >
                <Text>
                  {endDate ? endDate.toDateString() : "Select Date"}
                </Text>
              </Pressable>
            </Pressable>

            {/* AFTER */}
            <Pressable 
              onPress={() => setEndType("after")} 
              style={styles.radioRow}
            >
              <View style={[styles.radioDot, endType === "after" && styles.radioDotSelected]} />
              <Text style={{color: colors.text}}>After </Text>

              <TextInput
                keyboardType="numeric"
                editable={endType === "after"}
                style={[
                  styles.input,
                  {maxWidth: 50},
                  endType !== "after" && {opacity: 0.3}
                ]}
                value={occurrences}
                onChangeText={setOccurrences}
              />

              <Text style={{color: colors.text}}> occurrences</Text>
            </Pressable>

          </View>
      )}
      </View>



      {/* Catch-up Behavior */}
      {rule.type !== "none" && (
        <View style={{...styles.detailRow}}>
          <Text style={{...styles.settingText, flex:1}}>Missed Task Behavior</Text>
          <Pressable onPress={() => setSkippedIfMissed(!skipIfMissed)} style={styles.pressableButton}>
            <Text style={styles.buttonText}>{skipIfMissed?'Reschedule':'Persist'}</Text>
          </Pressable>
        </View>
      )}

      {/* Private */}
      <View style={styles.settingsRow}>
        <Text style={styles.settingText}>Private</Text>
        <Switch value={privateTask} onValueChange={setPrivateTask} />
      </View>

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