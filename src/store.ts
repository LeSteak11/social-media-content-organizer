import { create } from 'zustand';

interface AppState {
  accounts: any[];
  platforms: any[];
  media: any[];
  batches: any[];
  posts: any[];
  selectedMedia: number[];
  selectedBatches: number[];
  currentView: 'media' | 'batches' | 'posts' | 'calendar' | 'config';
  createPostFromBatch: number | null; // Batch ID to create post from
  
  setAccounts: (accounts: any[]) => void;
  setPlatforms: (platforms: any[]) => void;
  setMedia: (media: any[]) => void;
  setBatches: (batches: any[]) => void;
  setPosts: (posts: any[]) => void;
  setSelectedMedia: (media: number[]) => void;
  setSelectedBatches: (batches: number[]) => void;
  toggleMediaSelection: (id: number) => void;
  toggleBatchSelection: (id: number) => void;
  clearSelections: () => void;
  setCurrentView: (view: AppState['currentView']) => void;
  setCreatePostFromBatch: (batchId: number | null) => void;
}

export const useStore = create<AppState>((set) => ({
  accounts: [],
  platforms: [],
  media: [],
  batches: [],
  posts: [],
  selectedMedia: [],
  selectedBatches: [],
  currentView: 'media',
  createPostFromBatch: null,

  setAccounts: (accounts) => set({ accounts }),
  setPlatforms: (platforms) => set({ platforms }),
  setMedia: (media) => set({ media }),
  setBatches: (batches) => set({ batches }),
  setPosts: (posts) => set({ posts }),
  setSelectedMedia: (media) => set({ selectedMedia: media }),
  setSelectedBatches: (batches) => set({ selectedBatches: batches }),
  
  toggleMediaSelection: (id) => set((state) => ({
    selectedMedia: state.selectedMedia.includes(id)
      ? state.selectedMedia.filter(m => m !== id)
      : [...state.selectedMedia, id],
  })),
  
  toggleBatchSelection: (id) => set((state) => ({
    selectedBatches: state.selectedBatches.includes(id)
      ? state.selectedBatches.filter(b => b !== id)
      : [...state.selectedBatches, id],
  })),
  
  clearSelections: () => set({ selectedMedia: [], selectedBatches: [] }),
  setCurrentView: (view) => set({ currentView: view }),
  setCreatePostFromBatch: (batchId) => set({ createPostFromBatch: batchId }),
}));
