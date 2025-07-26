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
  CreatePortfolioData,
  CreatePositionData,
  Portfolio,
  Position,
  UpdatePortfolioData,
  UpdatePositionData,
} from '../models';

import { db } from '@/services/firebase/config';

// Collection name
const PORTFOLIOS_COLLECTION = 'portfolios';

// Helper function to generate unique position ID
const generatePositionId = (): string => {
  // Use crypto.randomUUID() if available (HTTPS/secure context)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (error) {
      console.warn('crypto.randomUUID() failed, falling back to custom ID generation', error);
    }
  }

  // Fallback: Generate RFC4122-like UUID manually
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Helper function to transform Position to Firestore document
const positionToFirestore = (position: Position) => {
  return {
    id: position.id,
    symbol: position.symbol,
    shares: position.shares,
    purchasePrice: position.purchasePrice,
    purchaseDate: Timestamp.fromDate(position.purchaseDate),
    notes: position.notes || null,
  };
};

// Helper function to transform Firestore document to Position
const firestoreToPosition = (firestorePosition: any): Position => {
  return {
    id: firestorePosition.id,
    symbol: firestorePosition.symbol,
    shares: firestorePosition.shares,
    purchasePrice: firestorePosition.purchasePrice,
    purchaseDate: firestorePosition.purchaseDate.toDate(),
    notes: firestorePosition.notes || undefined,
  };
};

// Helper function to transform portfolio data from Firestore
const transformPortfolioFromFirestore = (doc: any, docId: string): Portfolio => {
  const data = doc.data ? doc.data() : doc;

  return {
    id: docId,
    name: data.name,
    description: data.description,
    userId: data.userId,
    positions: data.positions ? data.positions.map(firestoreToPosition) : [],
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  };
};

/**
 * Create a new portfolio for the current user
 */
export const addPortfolio = async (
  userId: string,
  portfolioData: CreatePortfolioData
): Promise<Portfolio> => {
  try {
    const now = new Date();

    const portfolioToCreate = {
      ...portfolioData,
      userId,
      positions: [], // Initialize with empty positions array
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };

    const portfolioRef = await addDoc(collection(db, PORTFOLIOS_COLLECTION), portfolioToCreate);

    // Return the created portfolio with the generated ID
    return {
      id: portfolioRef.id,
      name: portfolioData.name,
      description: portfolioData.description,
      userId,
      positions: [],
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    console.error('Error creating portfolio:', error);
    throw new Error('Failed to create portfolio');
  }
};

/**
 * Get all portfolios for a specific user
 */
export const getUserPortfolios = async (userId: string): Promise<Portfolio[]> => {
  try {
    const q = query(
      collection(db, PORTFOLIOS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => transformPortfolioFromFirestore(doc, doc.id));
  } catch (error) {
    console.error('Error fetching user portfolios:', error);
    throw new Error('Failed to fetch portfolios');
  }
};

/**
 * Get a single portfolio by ID
 */
export const getPortfolioById = async (portfolioId: string): Promise<Portfolio | null> => {
  try {
    const portfolioRef = doc(db, PORTFOLIOS_COLLECTION, portfolioId);
    const portfolioDoc = await getDoc(portfolioRef);

    if (!portfolioDoc.exists()) {
      return null;
    }

    return transformPortfolioFromFirestore(portfolioDoc, portfolioDoc.id);
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    throw new Error('Failed to fetch portfolio');
  }
};

/**
 * Update an existing portfolio
 */
export const updatePortfolio = async (
  portfolioId: string,
  updateData: UpdatePortfolioData
): Promise<void> => {
  try {
    const portfolioRef = doc(db, PORTFOLIOS_COLLECTION, portfolioId);

    const dataToUpdate = {
      ...updateData,
      updatedAt: Timestamp.fromDate(new Date()),
    };

    await updateDoc(portfolioRef, dataToUpdate);
  } catch (error) {
    console.error('Error updating portfolio:', error);
    throw new Error('Failed to update portfolio');
  }
};

/**
 * Delete a portfolio
 */
export const deletePortfolio = async (portfolioId: string): Promise<void> => {
  try {
    const portfolioRef = doc(db, PORTFOLIOS_COLLECTION, portfolioId);
    await deleteDoc(portfolioRef);
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    throw new Error('Failed to delete portfolio');
  }
};

/**
 * Check if user owns a portfolio
 */
export const verifyPortfolioOwnership = async (
  portfolioId: string,
  userId: string
): Promise<boolean> => {
  try {
    const portfolio = await getPortfolioById(portfolioId);
    return portfolio?.userId === userId;
  } catch (error) {
    console.error('Error verifying portfolio ownership:', error);
    return false;
  }
};

// ========================
// POSITION MANAGEMENT
// ========================

/**
 * Add a new position to a portfolio
 */
export const addPositionToPortfolio = async (
  portfolioId: string,
  positionData: CreatePositionData
): Promise<Position> => {
  try {
    // Get current portfolio
    const portfolio = await getPortfolioById(portfolioId);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    // Create new position with unique ID
    const newPosition: Position = {
      id: generatePositionId(),
      symbol: positionData.symbol.toUpperCase(),
      shares: positionData.shares,
      purchasePrice: positionData.purchasePrice,
      purchaseDate: positionData.purchaseDate || new Date(),
      notes: positionData.notes,
    };

    // Add position to portfolio's positions array
    const updatedPositions = [...portfolio.positions, newPosition];

    // Update portfolio in Firestore
    const portfolioRef = doc(db, PORTFOLIOS_COLLECTION, portfolioId);
    await updateDoc(portfolioRef, {
      positions: updatedPositions.map(positionToFirestore),
      updatedAt: Timestamp.fromDate(new Date()),
    });

    return newPosition;
  } catch (error) {
    console.error('Error adding position to portfolio:', error);
    throw new Error('Failed to add position to portfolio');
  }
};

/**
 * Update an existing position in a portfolio
 */
export const updatePositionInPortfolio = async (
  portfolioId: string,
  positionId: string,
  updateData: UpdatePositionData
): Promise<void> => {
  try {
    // Get current portfolio
    const portfolio = await getPortfolioById(portfolioId);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    // Find and update the position
    const updatedPositions = portfolio.positions.map(position => {
      if (position.id === positionId) {
        return {
          ...position,
          ...updateData,
        };
      }
      return position;
    });

    // Check if position was found
    const positionExists = portfolio.positions.some(p => p.id === positionId);
    if (!positionExists) {
      throw new Error('Position not found');
    }

    // Update portfolio in Firestore
    const portfolioRef = doc(db, PORTFOLIOS_COLLECTION, portfolioId);
    await updateDoc(portfolioRef, {
      positions: updatedPositions.map(positionToFirestore),
      updatedAt: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    console.error('Error updating position:', error);
    throw new Error('Failed to update position');
  }
};

/**
 * Remove a position from a portfolio
 */
export const removePositionFromPortfolio = async (
  portfolioId: string,
  positionId: string
): Promise<void> => {
  try {
    // Get current portfolio
    const portfolio = await getPortfolioById(portfolioId);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    // Remove position from array
    const updatedPositions = portfolio.positions.filter(position => position.id !== positionId);

    // Check if position was found and removed
    if (updatedPositions.length === portfolio.positions.length) {
      throw new Error('Position not found');
    }

    // Update portfolio in Firestore
    const portfolioRef = doc(db, PORTFOLIOS_COLLECTION, portfolioId);
    await updateDoc(portfolioRef, {
      positions: updatedPositions.map(positionToFirestore),
      updatedAt: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    console.error('Error removing position:', error);
    throw new Error('Failed to remove position');
  }
};

/**
 * Get all unique symbols from a portfolio's positions
 */
export const getPortfolioSymbols = async (portfolioId: string): Promise<string[]> => {
  try {
    const portfolio = await getPortfolioById(portfolioId);
    if (!portfolio) {
      return [];
    }

    const symbols = portfolio.positions.map(position => position.symbol);
    return [...new Set(symbols)]; // Remove duplicates
  } catch (error) {
    console.error('Error getting portfolio symbols:', error);
    return [];
  }
};
