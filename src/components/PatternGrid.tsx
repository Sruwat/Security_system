import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

const PATTERN_VALUES = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

export function formatPatternValue(values: string[]): string {
  return values.join('-');
}

export function PatternGrid(props: {
  values: string[];
  onChange: (values: string[]) => void;
  accentColor: string;
  borderColor: string;
  textColor: string;
  mutedColor: string;
  compact?: boolean;
}) {
  const appendNode = React.useCallback(
    (value: string) => {
      if (props.values.includes(value) || props.values.length >= 9) {
        return;
      }
      props.onChange([...props.values, value]);
    },
    [props],
  );

  return (
    <View style={styles.wrap}>
      <View style={[styles.grid, props.compact ? styles.gridCompact : null]}>
        {PATTERN_VALUES.map(value => {
          const selectedIndex = props.values.indexOf(value);
          const selected = selectedIndex >= 0;
          return (
            <Pressable
              key={value}
              onPress={() => appendNode(value)}
              style={({pressed}) => [
                styles.node,
                props.compact ? styles.nodeCompact : null,
                {
                  borderColor: selected ? props.accentColor : props.borderColor,
                  backgroundColor: selected ? `${props.accentColor}22` : 'transparent',
                  opacity: pressed ? 0.92 : 1,
                },
              ]}>
              <View
                style={[
                  styles.innerNode,
                  props.compact ? styles.innerNodeCompact : null,
                  {backgroundColor: selected ? props.accentColor : props.mutedColor},
                ]}>
                <Text style={[styles.nodeLabel, props.compact ? styles.nodeLabelCompact : null, {color: selected ? '#FFFFFF' : props.textColor}]}>
                  {selected ? selectedIndex + 1 : value}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  grid: {
    width: 252,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 18,
  },
  gridCompact: {
    width: 228,
    rowGap: 14,
  },
  node: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeCompact: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  innerNode: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerNodeCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  nodeLabel: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 16,
  },
  nodeLabelCompact: {
    fontSize: 12,
    lineHeight: 14,
  },
});
