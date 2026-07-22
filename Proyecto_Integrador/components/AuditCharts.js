import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from './ScreenUI';

export function HorizontalBarChart({ title, subtitle, items, totalLabel, totalValue }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  const total = totalValue ?? items.reduce((sum, item) => sum + item.value, 0);
  return <View>
    <View style={styles.header}><View style={styles.headingBody}><Text style={styles.title}>{title}</Text>{subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}</View>
      {totalLabel && <View style={styles.total}><Text style={styles.totalValue}>{total}</Text><Text style={styles.totalLabel}>{totalLabel}</Text></View>}
    </View>
    <View style={styles.rows}>{items.map((item) => <View key={item.label} style={styles.row}>
      <View style={styles.legend}><View style={[styles.dot, { backgroundColor: item.color }]} /><Text style={styles.label}>{item.label}</Text><Text style={styles.value}>{item.value}</Text></View>
      <View style={styles.track}><View style={[styles.bar, { width: `${item.value ? Math.max(5, (item.value / max) * 100) : 0}%`, backgroundColor: item.color }]} /></View>
    </View>)}</View>
  </View>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 }, headingBody: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' }, subtitle: { color: colors.textSecondary, fontSize: 10, lineHeight: 15, marginTop: 4 },
  total: { minWidth: 64, minHeight: 64, borderRadius: 32, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }, totalValue: { color: colors.accentDark, fontSize: 20, fontWeight: '900' }, totalLabel: { color: colors.textSecondary, fontSize: 7, fontWeight: '800', textTransform: 'uppercase' },
  rows: { gap: 15 }, row: { gap: 7 }, legend: { flexDirection: 'row', alignItems: 'center', gap: 7 }, dot: { width: 8, height: 8, borderRadius: 4 }, label: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', flex: 1 }, value: { color: colors.textPrimary, fontSize: 12, fontWeight: '900' },
  track: { height: 11, borderRadius: 6, backgroundColor: colors.background, overflow: 'hidden' }, bar: { height: '100%', borderRadius: 6 },
});
