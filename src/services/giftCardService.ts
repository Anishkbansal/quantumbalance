import axios from 'axios';
import { API_URL } from '../config/constants';

interface GiftCardFormData {
  amount: number;
  recipientName: string;
  recipientEmail: string;
  currency: string;
  paymentIntentId: string;
  message?: string;
}

interface GiftCardBuyer {
  _id: string;
  name: string;
  email: string;
}

interface GiftCardRecipient {
  name: string;
  email: string;
}

interface GiftCard {
  _id: string;
  code: string;
  amount: number;
  currency: string;
  isRedeemed: boolean;
  amountUsed: number;
  remainingBalance: number;
  status: 'active' | 'expired' | 'exhausted';
  expiryDate: string;
  recipient: GiftCardRecipient;
  buyer: GiftCardBuyer;
  message?: string;
  createdAt: string;
}

export const getMinAmounts = async (): Promise<Record<string, number>> => {
  try {
    const response = await axios.get(`${API_URL}/gift-cards/min-amounts`);
    if (response.data.success) {
      return response.data.minAmounts;
    }
    throw new Error(response.data.message || 'Failed to get minimum amounts');
  } catch (error: any) {
    console.error('Error getting min amounts:', error);
    throw error;
  }
};

export const createGiftCard = async (data: GiftCardFormData): Promise<{ success: boolean; message: string; giftCard?: any }> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/gift-cards/create`,
      data,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      return {
        success: true,
        message: response.data.message,
        giftCard: response.data.giftCard
      };
    }
    
    throw new Error(response.data.message || 'Failed to create gift card');
  } catch (error: any) {
    console.error('Error creating gift card:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to create gift card'
    };
  }
};

export const getUserPurchases = async (): Promise<GiftCard[]> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${API_URL}/gift-cards/my-purchases`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      return response.data.giftCards;
    }
    
    throw new Error(response.data.message || 'Failed to get gift cards');
  } catch (error: any) {
    console.error('Error getting gift cards:', error);
    throw error;
  }
};

export const getUserReceivedGiftCards = async (): Promise<GiftCard[]> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${API_URL}/gift-cards/my-received`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      return response.data.giftCards;
    }
    
    throw new Error(response.data.message || 'Failed to get received gift cards');
  } catch (error: any) {
    console.error('Error getting received gift cards:', error);
    throw error;
  }
};

export const getGiftCardByCode = async (code: string): Promise<GiftCard> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${API_URL}/gift-cards/by-code/${code}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      return response.data.giftCard;
    }
    
    throw new Error(response.data.message || 'Failed to get gift card');
  } catch (error: any) {
    console.error('Error getting gift card:', error);
    throw error;
  }
};

export const redeemGiftCard = async (code: string): Promise<{ success: boolean; message: string; giftCard?: any }> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/gift-cards/redeem`,
      { code },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      return {
        success: true,
        message: response.data.message,
        giftCard: response.data.giftCard
      };
    }
    
    throw new Error(response.data.message || 'Failed to redeem gift card');
  } catch (error: any) {
    console.error('Error redeeming gift card:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to redeem gift card'
    };
  }
}; 