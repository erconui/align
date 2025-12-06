import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import React, { useState } from "react";
import { Modal, Pressable, Switch, Text, TextInput, View } from "react-native";
import { useTheme } from "../hooks/useTheme";

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RecurrenceRule, TaskInstance, TaskParams } from "../types";

const defaultRule: RecurrenceRule = {
  frequency: 'none',
  interval: 1,
  skip_if_missed: false,
  end_type: 'never',
  end_date: null,
  occurrences: 1
};
interface Props {
  task: TaskInstance | null;
  onSave: (updated: TaskParams) => void;
  onClose: () => void;
}

export default function TaskDetail({ task, onSave, onClose }: Props) {
  if (!task) {
    return '';
  }
  // Basic fields
  const [title, setTitle] = useState(task.title);
  const [privateTask, setPrivateTask] = useState(task.private);
  const [backlogTask, setBacklogTask] = useState(task.backlog);
  const [skipIfMissed, setSkippedIfMissed] = useState(task.recurrence?.skip_if_missed || false);
  const [dueDate, setDueDate] = useState(
    task.due_date ? new Date(task.due_date) : null
  );
  const [showDuePicker, setShowDuePicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [frequency, setFrequency] = useState(task.recurrence?.frequency || 'none');
  const [interval, setInterval] = useState<number>(task.recurrence?.interval || 1);
  const [endType, setEndType] = useState(task.recurrence?.end_type || 'never');
  const [endDate, setEndDate] = useState(task.recurrence?.end_date? new Date(task.recurrence?.end_date) : null);
  const [byDay, setByDay] = useState(task.recurrence?.by_day);
  const { colors, styles, toggleTheme, theme } = useTheme();
  const insets = useSafeAreaInsets();


  // const [rule, setRule] = useState<RecurrenceRule>(task.recurrence || defaultRule);
  // console.log(rule);
  const [occurrencesText, setOccurrencesText] = useState(task.recurrence?.occurrences?task.recurrence.occurrences.toString():"1");
  const [occurrences, setOccurrences] = useState(task.recurrence?.occurrences?task.recurrence.occurrences:1);

  const toggleDay = (day: number) => {
    const current = byDay ?? [];
    const next = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day];

    setByDay(next);
  };

  const save = () => {
    const rule : RecurrenceRule = {
      frequency: frequency,
      interval: interval,
      skip_if_missed: skipIfMissed,
      end_type: endType,
      end_date: endDate?endDate.toISOString() : null,
      occurrences: occurrences
    }
    // console.log('save rule',rule);
    const updated: TaskParams = {
      id: task.id,
      template_id: task.template_id,
      parent_id: task.parent_id,
      title:title,
      completed: task.completed,
      completed_at: task.completed_at,
      due_date: dueDate ? dueDate.toISOString() : null,
      created_at: task.created_at,
      updated_at: new Date().toISOString(),
      recurrence_rule_id: task.recurrence_rule_id,
      recurrence: rule,
      position: task.position,
      expanded: task.expanded,
      private: privateTask,
      backlog: backlogTask
    };

    onSave(updated);
    onClose();
  };

  return (
    <Modal 
      animationType="slide"
      transparent>
      <View style={{ flex: 1, backgroundColor: colors.background, marginTop: insets.top }}>

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
        {dueDate && (
          <Pressable onPress={() => setDueDate(null)} style={styles.deleteButton}>
            <Text style={{color: 'red'}}>Clear</Text>
          </Pressable>
        )}
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
            selectedValue={frequency}
            onValueChange={(v) => setFrequency(v)}
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
      {(frequency === "weekly" || frequency === "custom") && (
        <View style={{...styles.detailRow, flexDirection:'column', borderBottomWidth:0}}>
          <Text style={styles.settingText}>Days of Week</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, idx) => {
              const selected = byDay?.includes(idx);
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
      {(frequency !== "none" && frequency !== "daily") && (
        <View style={{...styles.detailRow, borderBottomWidth:0}}>
          <Text style={{color:colors.text}}>Every N {frequency === "weekly" ? "weeks" : frequency + "s"}</Text>
          <TextInput
            keyboardType="numeric"
            value={String(interval ?? 1)}
            onChangeText={(txt) => setInterval(Number(txt) || 1)
            }
            // style={{...styles.input, padding: 8, borderWidth: 1, borderRadius: 8 }}
            style={styles.input}
          />
        </View>
      )}
      {(frequency !== "none") && (
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
                  endType !== "on" && {opacity: 0.7}
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
                  endType !== "after" && {opacity: 0.7}
                ]}
                value={occurrencesText}
                onChangeText={(text) => {
                  setOccurrencesText(text);
                  const num = parseInt(text,10);
                  // console.log('occurrences',num);
                  if (!isNaN(num)) {
                    setOccurrences(Math.max(1,num));
                  } else {
                    setOccurrences(1);
                  }
                }}
                onBlur={() => {
                  const num = parseInt(occurrencesText,10);
                  // console.log('occurrences',num);
                  if (!isNaN(num)) {
                    setOccurrences(num);
                  } else {
                    setOccurrencesText("1");
                    setOccurrences(1);
                  }

                }}
              />

              <Text style={{color: colors.text}}> occurrences</Text>
            </Pressable>

          </View>
      )}
      </View>



      {/* Catch-up Behavior */}
      {frequency !== "none" && (
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

      {/* Private */}
      <View style={styles.settingsRow}>
        <Text style={styles.settingText}>Backlog</Text>
        <Switch value={backlogTask} onValueChange={setBacklogTask} />
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