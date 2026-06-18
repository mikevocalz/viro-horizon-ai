/**
 * Mounts the classification results list on a secondary runtime so building the
 * top-5 bars never competes with the main thread (image preview, pickers).
 */
import { StyleSheet } from 'react-native';
import { OnRuntime } from '@react-native-runtimes/core';

import { ClassifyResultsList } from './ClassifyResultsList';

export function ClassifyResultsSurface() {
  return (
    <OnRuntime name="classify-runtime" style={styles.flex}>
      <ClassifyResultsList />
    </OnRuntime>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
