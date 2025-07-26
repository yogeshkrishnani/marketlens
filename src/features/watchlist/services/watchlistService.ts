// src/features/watchlist/services/watchlistService.ts

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import {
  CreateWatchlistData,
  isValidSymbol,
  isValidWatchlistName,
  UpdateWatchlistData,
  Watchlist,
  WATCHLIST_CONSTRAINTS,
} from '../models';

import { db } from '@/services/firebase/config';

// Collection name
const WATCHLISTS_COLLECTION = 'watchlists';

// Helper function to transform Watchlist to Firestore document
const watchlistToFirestore = (watchlist: Omit<Watchlist, 'id'>) => {
  return {
    name: watchlist.name,
    userId: watchlist.userId,
    symbols: watchlist.symbols,
    createdAt: Timestamp.fromDate(watchlist.createdAt),
    updatedAt: Timestamp.fromDate(watchlist.updatedAt),
  };
};

// Helper function to transform Firestore document to Watchlist
const firestoreToWatchlist = (doc: any, docId: string): Watchlist => {
  const data = doc.data ? doc.data() : doc;

  return {
    id: docId,
    name: data.name,
    userId: data.userId,
    symbols: data.symbols || [],
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  };
};

/**
 * Create a new watchlist for the current user
 */
export const createWatchlist = async (
  userId: string,
  watchlistData: CreateWatchlistData
): Promise<Watchlist> => {
  try {
    // Validate input
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!isValidWatchlistName(watchlistData.name)) {
      throw new Error(
        `Watchlist name must be between ${WATCHLIST_CONSTRAINTS.MIN_NAME_LENGTH} and ${WATCHLIST_CONSTRAINTS.MAX_NAME_LENGTH} characters`
      );
    }

    // Validate symbols if provided
    const symbols = watchlistData.symbols || [];
    if (symbols.length > WATCHLIST_CONSTRAINTS.MAX_SYMBOLS_PER_WATCHLIST) {
      throw new Error(
        `Maximum ${WATCHLIST_CONSTRAINTS.MAX_SYMBOLS_PER_WATCHLIST} symbols allowed per watchlist`
      );
    }

    // Validate each symbol
    const validatedSymbols: string[] = [];
    for (const symbol of symbols) {
      const upperSymbol = symbol.toUpperCase().trim();
      if (!isValidSymbol(upperSymbol)) {
        throw new Error(`Invalid stock symbol: ${symbol}`);
      }
      if (!validatedSymbols.includes(upperSymbol)) {
        validatedSymbols.push(upperSymbol);
      }
    }

    const now = new Date();

    const watchlistToCreate = {
      name: watchlistData.name.trim(),
      userId,
      symbols: validatedSymbols,
      createdAt: now,
      updatedAt: now,
    };

    const watchlistRef = await addDoc(
      collection(db, WATCHLISTS_COLLECTION),
      watchlistToFirestore(watchlistToCreate)
    );

    // Return the created watchlist with the generated ID
    return {
      id: watchlistRef.id,
      ...watchlistToCreate,
    };
  } catch (error) {
    console.error('Error creating watchlist:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create watchlist');
  }
};

/**
 * Get all watchlists for a specific user
 */
export const getUserWatchlists = async (userId: string): Promise<Watchlist[]> => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const q = query(
      collection(db, WATCHLISTS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => firestoreToWatchlist(doc, doc.id));
  } catch (error) {
    console.error('Error fetching user watchlists:', error);
    throw new Error('Failed to fetch watchlists');
  }
};

/**
 * Get a single watchlist by ID
 */
export const getWatchlistById = async (watchlistId: string): Promise<Watchlist | null> => {
  try {
    if (!watchlistId) {
      throw new Error('Watchlist ID is required');
    }

    const watchlistRef = doc(db, WATCHLISTS_COLLECTION, watchlistId);
    const watchlistDoc = await getDoc(watchlistRef);

    if (!watchlistDoc.exists()) {
      return null;
    }

    return firestoreToWatchlist(watchlistDoc, watchlistDoc.id);
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    throw new Error('Failed to fetch watchlist');
  }
};

/**
 * Update an existing watchlist
 */
export const updateWatchlist = async (
  watchlistId: string,
  updateData: UpdateWatchlistData
): Promise<void> => {
  try {
    if (!watchlistId) {
      throw new Error('Watchlist ID is required');
    }

    // Validate name if provided
    if (updateData.name !== undefined && !isValidWatchlistName(updateData.name)) {
      throw new Error(
        `Watchlist name must be between ${WATCHLIST_CONSTRAINTS.MIN_NAME_LENGTH} and ${WATCHLIST_CONSTRAINTS.MAX_NAME_LENGTH} characters`
      );
    }

    // Validate symbols if provided
    let validatedSymbols: string[] | undefined;
    if (updateData.symbols !== undefined) {
      if (updateData.symbols.length > WATCHLIST_CONSTRAINTS.MAX_SYMBOLS_PER_WATCHLIST) {
        throw new Error(
          `Maximum ${WATCHLIST_CONSTRAINTS.MAX_SYMBOLS_PER_WATCHLIST} symbols allowed per watchlist`
        );
      }

      // Validate each symbol
      validatedSymbols = [];
      for (const symbol of updateData.symbols) {
        const upperSymbol = symbol.toUpperCase().trim();
        if (!isValidSymbol(upperSymbol)) {
          throw new Error(`Invalid stock symbol: ${symbol}`);
        }
        if (!validatedSymbols.includes(upperSymbol)) {
          validatedSymbols.push(upperSymbol);
        }
      }
    }

    const watchlistRef = doc(db, WATCHLISTS_COLLECTION, watchlistId);

    // Build update object with proper types
    const dataToUpdate: {
      name?: string;
      symbols?: string[];
      updatedAt: Timestamp;
    } = {
      updatedAt: Timestamp.fromDate(new Date()),
    };

    // Add fields only if they're being updated
    if (updateData.name !== undefined) {
      dataToUpdate.name = updateData.name.trim();
    }

    if (validatedSymbols !== undefined) {
      dataToUpdate.symbols = validatedSymbols;
    }

    await updateDoc(watchlistRef, dataToUpdate);
  } catch (error) {
    console.error('Error updating watchlist:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update watchlist');
  }
};

/**
 * Delete a watchlist
 */
export const deleteWatchlist = async (watchlistId: string): Promise<void> => {
  try {
    if (!watchlistId) {
      throw new Error('Watchlist ID is required');
    }

    const watchlistRef = doc(db, WATCHLISTS_COLLECTION, watchlistId);
    await deleteDoc(watchlistRef);
  } catch (error) {
    console.error('Error deleting watchlist:', error);
    throw new Error('Failed to delete watchlist');
  }
};

/**
 * Add a symbol to a watchlist
 */
export const addSymbolToWatchlist = async (watchlistId: string, symbol: string): Promise<void> => {
  try {
    if (!watchlistId) {
      throw new Error('Watchlist ID is required');
    }

    const upperSymbol = symbol.toUpperCase().trim();
    if (!isValidSymbol(upperSymbol)) {
      throw new Error(`Invalid stock symbol: ${symbol}`);
    }

    // Get current watchlist
    const watchlist = await getWatchlistById(watchlistId);
    if (!watchlist) {
      throw new Error('Watchlist not found');
    }

    // Check if symbol already exists
    if (watchlist.symbols.includes(upperSymbol)) {
      throw new Error(`Symbol ${upperSymbol} is already in this watchlist`);
    }

    // Check symbol limit
    if (watchlist.symbols.length >= WATCHLIST_CONSTRAINTS.MAX_SYMBOLS_PER_WATCHLIST) {
      throw new Error(
        `Maximum ${WATCHLIST_CONSTRAINTS.MAX_SYMBOLS_PER_WATCHLIST} symbols allowed per watchlist`
      );
    }

    // Add symbol to watchlist
    const updatedSymbols = [...watchlist.symbols, upperSymbol];
    await updateWatchlist(watchlistId, { symbols: updatedSymbols });
  } catch (error) {
    console.error('Error adding symbol to watchlist:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to add symbol to watchlist');
  }
};

/**
 * Remove a symbol from a watchlist
 */
export const removeSymbolFromWatchlist = async (
  watchlistId: string,
  symbol: string
): Promise<void> => {
  try {
    if (!watchlistId) {
      throw new Error('Watchlist ID is required');
    }

    const upperSymbol = symbol.toUpperCase().trim();

    // Get current watchlist
    const watchlist = await getWatchlistById(watchlistId);
    if (!watchlist) {
      throw new Error('Watchlist not found');
    }

    // Check if symbol exists in watchlist
    if (!watchlist.symbols.includes(upperSymbol)) {
      throw new Error(`Symbol ${upperSymbol} is not in this watchlist`);
    }

    // Remove symbol from watchlist
    const updatedSymbols = watchlist.symbols.filter(s => s !== upperSymbol);
    await updateWatchlist(watchlistId, { symbols: updatedSymbols });
  } catch (error) {
    console.error('Error removing symbol from watchlist:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to remove symbol from watchlist');
  }
};

/**
 * Check if user owns a watchlist
 */
export const verifyWatchlistOwnership = async (
  watchlistId: string,
  userId: string
): Promise<boolean> => {
  try {
    const watchlist = await getWatchlistById(watchlistId);
    return watchlist?.userId === userId;
  } catch (error) {
    console.error('Error verifying watchlist ownership:', error);
    return false;
  }
};

/**
 * Get watchlists count for a user (to enforce limits)
 */
export const getUserWatchlistCount = async (userId: string): Promise<number> => {
  try {
    if (!userId) {
      return 0;
    }

    const q = query(collection(db, WATCHLISTS_COLLECTION), where('userId', '==', userId));

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting user watchlist count:', error);
    return 0;
  }
};

/**
 * Check if user can create more watchlists
 */
export const canUserCreateWatchlist = async (userId: string): Promise<boolean> => {
  try {
    const currentCount = await getUserWatchlistCount(userId);
    return currentCount < WATCHLIST_CONSTRAINTS.MAX_WATCHLISTS_PER_USER;
  } catch (error) {
    console.error('Error checking watchlist creation limit:', error);
    return false;
  }
};

/**
 * Get all unique symbols across user's watchlists (useful for batch API calls)
 */
export const getUserWatchlistSymbols = async (userId: string): Promise<string[]> => {
  try {
    const watchlists = await getUserWatchlists(userId);
    const allSymbols = watchlists.flatMap(watchlist => watchlist.symbols);
    return [...new Set(allSymbols)]; // Remove duplicates
  } catch (error) {
    console.error('Error getting user watchlist symbols:', error);
    return [];
  }
};
