import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { cartApi, ApiError } from '../services/api';

interface CartItem {
  product: {
    _id: string;
    teffType: string;
    pricePerKilo: number;
    stockAvailable: number;
    merchant?: {
      _id: string;
      name: string;
    };
  };
  merchant: {
    _id: string;
    name: string;
  };
  teffType: string;
  quantity: number;
  pricePerKilo: number;
}

interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
}

interface GuestCartItem {
  productId: string;
  product: {
    _id: string;
    teffType: string;
    pricePerKilo: number;
    stockAvailable: number;
    merchant?: {
      _id: string;
      name: string;
    };
  };
  merchant: {
    _id: string;
    name: string;
  };
  teffType: string;
  quantity: number;
  pricePerKilo: number;
}

interface CartContextType {
  cart: Cart | null;
  guestCart: GuestCartItem[];
  loading: boolean;
  isAuthenticated: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (productId: string, quantity: number, productData?: any) => Promise<void>;
  updateItem: (itemIndex: number, quantity: number) => Promise<void>;
  removeItem: (itemIndex: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_CART_KEY = 'teffexpo_guest_cart';

const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [guestCart, setGuestCart] = useState<GuestCartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load guest cart from localStorage
  useEffect(() => {
    const storedCart = localStorage.getItem(GUEST_CART_KEY);
    if (storedCart) {
      try {
        setGuestCart(JSON.parse(storedCart));
      } catch (error) {
        console.error('Failed to parse guest cart:', error);
      }
    }
  }, []);

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    if (token) {
      refreshCart();
    }
  }, []);

  const saveGuestCart = (items: GuestCartItem[]) => {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    setGuestCart(items);
  };

  const refreshCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    try {
      const cartData = await cartApi.getCart();
      setCart(cartData as Cart);
      // Clear guest cart when user logs in
      localStorage.removeItem(GUEST_CART_KEY);
      setGuestCart([]);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity: number, productData?: any) => {
    const token = localStorage.getItem('token');
    
    if (token && isAuthenticated) {
      // Authenticated user - use API
      try {
        await cartApi.addToCart(productId, quantity);
        await refreshCart();
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }
        throw new Error('Failed to add item to cart');
      }
    } else {
      // Guest user - use localStorage
      if (!productData) {
        throw new Error('Product data is required for guest cart');
      }

      const newItem: GuestCartItem = {
        productId: productId,
        product: productData,
        merchant: productData.merchant || { _id: productData.merchantId, name: productData.merchantName || 'Unknown' },
        teffType: productData.teffType,
        quantity: quantity,
        pricePerKilo: productData.pricePerKilo,
      };

      // Check if item already exists
      const existingIndex = guestCart.findIndex(
        (item) => item.productId === productId
      );

      let updatedCart: GuestCartItem[];
      if (existingIndex > -1) {
        // Update quantity
        updatedCart = [...guestCart];
        updatedCart[existingIndex].quantity += quantity;
      } else {
        // Add new item
        updatedCart = [...guestCart, newItem];
      }

      saveGuestCart(updatedCart);
    }
  };

  const updateItem = async (itemIndex: number, quantity: number) => {
    const token = localStorage.getItem('token');

    if (token && isAuthenticated) {
      // Authenticated user - use API
      try {
        await cartApi.updateCartItem(itemIndex, quantity);
        await refreshCart();
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }
        throw new Error('Failed to update cart item');
      }
    } else {
      // Guest user - use localStorage
      if (itemIndex < 0 || itemIndex >= guestCart.length) {
        throw new Error('Invalid item index');
      }

      const updatedCart = [...guestCart];
      updatedCart[itemIndex].quantity = quantity;
      saveGuestCart(updatedCart);
    }
  };

  const removeItem = async (itemIndex: number) => {
    const token = localStorage.getItem('token');

    if (token && isAuthenticated) {
      // Authenticated user - use API
      try {
        await cartApi.removeFromCart(itemIndex);
        await refreshCart();
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }
        throw new Error('Failed to remove cart item');
      }
    } else {
      // Guest user - use localStorage
      if (itemIndex < 0 || itemIndex >= guestCart.length) {
        throw new Error('Invalid item index');
      }

      const updatedCart = guestCart.filter((_, index) => index !== itemIndex);
      saveGuestCart(updatedCart);
    }
  };

  const clearCart = async () => {
    const token = localStorage.getItem('token');

    if (token && isAuthenticated) {
      // Authenticated user - use API
      try {
        await cartApi.clearCart();
        await refreshCart();
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }
        throw new Error('Failed to clear cart');
      }
    } else {
      // Guest user - use localStorage
      saveGuestCart([]);
    }
  };

  // Calculate totals from either cart or guestCart
  const currentItems = isAuthenticated && cart ? cart.items : guestCart;
  const totalItems = currentItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = currentItems.reduce(
    (sum, item) => sum + (item.quantity * item.pricePerKilo),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        guestCart,
        loading,
        isAuthenticated,
        refreshCart,
        addToCart,
        updateItem,
        removeItem,
        clearCart,
        totalItems,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export { CartProvider };
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
