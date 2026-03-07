import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
  isOnline: navigator.onLine,
  isSyncing: false,
  lastSyncTime: null,
  pendingTransactions: 0,
  syncStatus: 'idle',
  syncError: null,
  masterDataLoaded: false,
};

// Action types
const OFFLINE_ACTIONS = {
  SET_ONLINE_STATUS: 'SET_ONLINE_STATUS',
  SET_SYNC_STATUS: 'SET_SYNC_STATUS',
  SET_PENDING_TRANSACTIONS: 'SET_PENDING_TRANSACTIONS',
  SET_MASTER_DATA_LOADED: 'SET_MASTER_DATA_LOADED',
  SET_LAST_SYNC_TIME: 'SET_LAST_SYNC_TIME',
  SET_SYNC_ERROR: 'SET_SYNC_ERROR',
  CLEAR_SYNC_ERROR: 'CLEAR_SYNC_ERROR',
};

// Reducer
const offlineReducer = (state, action) => {
  switch (action.type) {
    case OFFLINE_ACTIONS.SET_ONLINE_STATUS:
      return { ...state, isOnline: action.payload };
    case OFFLINE_ACTIONS.SET_SYNC_STATUS:
      return { ...state, syncStatus: action.payload, isSyncing: action.payload === 'syncing' };
    case OFFLINE_ACTIONS.SET_PENDING_TRANSACTIONS:
      return { ...state, pendingTransactions: action.payload };
    case OFFLINE_ACTIONS.SET_MASTER_DATA_LOADED:
      return { ...state, masterDataLoaded: action.payload };
    case OFFLINE_ACTIONS.SET_LAST_SYNC_TIME:
      return { ...state, lastSyncTime: action.payload };
    case OFFLINE_ACTIONS.SET_SYNC_ERROR:
      return { ...state, syncError: action.payload, syncStatus: 'error' };
    case OFFLINE_ACTIONS.CLEAR_SYNC_ERROR:
      return { ...state, syncError: null, syncStatus: 'idle' };
    default:
      return state;
  }
};

// Create context
const OfflineContext = createContext();

// Provider component
export const OfflineProvider = ({ children }) => {
  const [state, dispatch] = useReducer(offlineReducer, initialState);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => dispatch({ type: OFFLINE_ACTIONS.SET_ONLINE_STATUS, payload: true });
    const handleOffline = () => dispatch({ type: OFFLINE_ACTIONS.SET_ONLINE_STATUS, payload: false });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Simple placeholder functions - no complex operations
  const value = {
    ...state,
    downloadMasterData: async () => console.log('downloadMasterData placeholder'),
    uploadPendingTransactions: async () => console.log('uploadPendingTransactions placeholder'),
    addOfflineTransaction: async () => console.log('addOfflineTransaction placeholder'),
    clearSyncError: () => dispatch({ type: OFFLINE_ACTIONS.CLEAR_SYNC_ERROR }),
    forceSync: async () => console.log('forceSync placeholder'),
  };

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
};

// Hook to use offline context
export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
