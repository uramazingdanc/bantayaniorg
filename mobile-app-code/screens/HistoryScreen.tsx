/**
 * BantayAni Mobile - History Screen
 * View past captures and sync status
 * 
 * Usage in Expo project with React Native
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useCaptureStore, CaptureMetadata } from '../store/captureStore';
import { syncPendingCaptures } from '../services/uploadService';

export default function HistoryScreen() {
  const {
    captures,
    pendingSyncCount,
    isOnline,
    getPendingCaptures,
    markAsSynced,
  } = useCaptureStore();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ synced: 0, total: 0 });

  // Handle sync all pending
  const handleSyncAll = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Please connect to the internet to sync.');
      return;
    }

    const pending = getPendingCaptures();
    if (pending.length === 0) {
      Alert.alert('All Synced', 'No pending captures to sync.');
      return;
    }

    setIsSyncing(true);
    setSyncProgress({ synced: 0, total: pending.length });

    try {
      const result = await syncPendingCaptures(
        pending,
        'farmer_user_id', // Replace with actual farmer ID
        (synced, total) => {
          setSyncProgress({ synced, total });
        },
        (captureId) => {
          markAsSynced(captureId);
        }
      );

      Alert.alert(
        'Sync Complete',
        `Successfully synced ${result.successCount} captures.\n${
          result.failedCount > 0 ? `${result.failedCount} failed.` : ''
        }`
      );
    } catch (error) {
      Alert.alert('Sync Error', 'Failed to sync some captures. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status color
  const getStatusColor = (status: CaptureMetadata['status']) => {
    switch (status) {
      case 'verified':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      default:
        return '#FF9800';
    }
  };

  // Render capture item
  const renderItem = ({ item }: { item: CaptureMetadata }) => (
    <View style={styles.captureCard}>
      <Image source={{ uri: item.imageUri }} style={styles.captureImage} />
      
      <View style={styles.captureInfo}>
        <View style={styles.captureHeader}>
          <Text style={styles.pestName}>{item.detectedPest}</Text>
          {!item.isSynced && (
            <View style={styles.unsyncedBadge}>
              <Text style={styles.unsyncedText}>Pending Sync</Text>
            </View>
          )}
        </View>

        <Text style={styles.cropType}>
          {item.cropType} • {item.aiConfidence.toFixed(1)}% confidence
        </Text>

        <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>

        {item.gpsCoordinates && (
          <Text style={styles.location}>
            📍 {item.gpsCoordinates.lat.toFixed(4)}, {item.gpsCoordinates.lng.toFixed(4)}
          </Text>
        )}

        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(item.status)}20` },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(item.status) },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(item.status) },
              ]}
            >
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Detection History</Text>
        <Text style={styles.subtitle}>
          {captures.length} captures • {pendingSyncCount} pending sync
        </Text>
      </View>

      {/* Sync Button */}
      {pendingSyncCount > 0 && (
        <TouchableOpacity
          style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
          onPress={handleSyncAll}
          disabled={isSyncing}
        >
          <Text style={styles.syncButtonText}>
            {isSyncing
              ? `Syncing... (${syncProgress.synced}/${syncProgress.total})`
              : `Sync ${pendingSyncCount} Pending`}
          </Text>
        </TouchableOpacity>
      )}

      {/* Capture List */}
      <FlatList
        data={captures}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {}}
            tintColor="#4CAF50"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📷</Text>
            <Text style={styles.emptyTitle}>No Captures Yet</Text>
            <Text style={styles.emptyText}>
              Use the camera to detect pests and they'll appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f0a',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(76, 175, 80, 0.2)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  syncButton: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  syncButtonDisabled: {
    opacity: 0.7,
  },
  syncButtonText: {
    color: '#0a0f0a',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  captureCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(27, 46, 27, 0.5)',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  captureImage: {
    width: 100,
    height: 120,
    backgroundColor: '#1b2e1b',
  },
  captureInfo: {
    flex: 1,
    padding: 12,
  },
  captureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  unsyncedBadge: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  unsyncedText: {
    color: '#FF9800',
    fontSize: 10,
    fontWeight: '500',
  },
  cropType: {
    fontSize: 13,
    color: '#4CAF50',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  location: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
