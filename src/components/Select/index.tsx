/*
 * @Author: Hong.Zhang
 * @Date: 2021-11-22 15:24:37
 * @Description: 
 */
import React, { useEffect, useRef } from 'react';
import { Dimensions, Image, Text, TouchableWithoutFeedback, View, Platform, ScrollView } from 'react-native';
import { Images } from '../../theme';
import styles from './style';

export function Select(props: SelectProps) {
  const {
    style,
    status,
    value,
    textStyle,
    onChange,
    items,
    disabled,
  } = props;

  const [focused, setFocused] = React.useState(false);
  const [expand, setExpand] = React.useState<boolean|undefined>();
  const [yInParent , setYInParent] = React.useState(0);
  const [direction, setDirection] = React.useState('top');
  const parentRef = useRef(null);
  const guidelineRef = useRef(null);
  const isAndroid = Platform.OS === 'android';
  const isDirectionTop = direction === 'top';

  useEffect(() => {
    setFocused(!!expand);
  }, [expand]);

  async function toggleSelect() {
    if (guidelineRef.current) {
      // @ts-ignore-next-line
      guidelineRef.current.measureInWindow((_: number, y: number) => {
        const screenHeight = Dimensions.get('window').height
        const overflow = y + 48 + 240 > screenHeight;
        setDirection(overflow ? 'bottom': 'top');
        setExpand(ex => !ex);
      });
      // @ts-ignore-next-line
      guidelineRef.current.measureLayout(parentRef.current, (_: number, y: number) => {
        setYInParent(y);
      }); 
    }
  }

  function getDropdown() {
    return items.map((item, _) => {
      const selected = item.value === value;
      return (
        <TouchableWithoutFeedback
          onPress={() => {
            if (onChange) {
              onChange(item.value);
            }
            setExpand(false);
          }}
          key={item.value}
        >
          <View 
            style={[styles.itemContainer, selected ? styles.selected : styles.notSelected]}
          >
            <Text style={[styles.itemText, textStyle]}>
              {item.label}
            </Text>
            {selected && <Image source={Images.correct} style={styles.itemImage}/>}
          </View>
        </TouchableWithoutFeedback>
      );
    });
  }

  return (
    <View ref={parentRef} style={[isAndroid ? styles.androidContainer: styles.iosContainer, style]}>
      <TouchableWithoutFeedback
        onPress={toggleSelect}
      >
        <View style={[styles.selectContainer]}>
          <Text
            style={[
              styles.content,
              focused ? styles.focused : styles.blur,
              expand && isDirectionTop && styles.expandTop,
              expand && !isDirectionTop && styles.expandBototm,
              // @ts-ignore
              status && status !== 'success' && styles[status],
              disabled ? styles.disabled : styles.enabled,
              textStyle,
            ]}
          >
            {value}
          </Text>
          <Image
            source={Images.arrowUp}
            style={expand ? styles.arrowUp : styles.arrowReverse}
          />
        </View>
      </TouchableWithoutFeedback>
      <View style={styles.guideline} ref={guidelineRef}/>
      {expand && (
        <View
          style={[styles.dropdown, isDirectionTop ? styles.dropdownTop : styles.dropdownBottom, {[direction]: isDirectionTop ? yInParent - 1: 47}]}
        >
          <ScrollView
            nestedScrollEnabled={true}
          >
            {getDropdown()}
          </ScrollView>
        </View>
     )}
    </View>
  );
}

export interface SelectProps {
  style?: any;
  status?: 'error' | 'success' | 'warning';
  value?: string;
  onChange?: (value: string) => void;
  items: { label: string, value: string }[];
  disabled?: boolean;
  textStyle?: any;
}
