import {  useEffect, useState } from "react";
import type {ReactNode} from "react";
import { Button } from "@/components/ui/button";

// TypeScript declarations for Lemon.js
declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: {
      Url: {
        Open: (url: string) => void;
      };
    };
  }
}

interface UpgradeButtonProps {
  variantId: string;
  email: string;
  orgName: string;
  orgConvexId: string;
  disabled?: boolean;
  children?: ReactNode;
}

export function UpgradeButton({
  variantId,
  email,
  orgName,
  orgConvexId,
  disabled,
  children = "Upgrade Plan",
}: UpgradeButtonProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load Lemon.js script
    const script = document.createElement("script");
    script.src = "https://app.lemonsqueezy.com/js/lemon.js";
    script.defer = true;

    script.onload = () => {
      // Initialize Lemon.js for React
      if (window.createLemonSqueezy) {
        window.createLemonSqueezy();
        setIsLoaded(true);
      }
    };

    document.body.appendChild(script);

    // Cleanup on unmount
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleUpgrade = () => {
    if (!isLoaded || !window.LemonSqueezy) return;

    // Get store slug from environment
    const storeSlug = import.meta.env.VITE_LEMONSQUEEZY_STORE_SLUG;
    if (!storeSlug) {
      console.error("VITE_LEMONSQUEEZY_STORE_SLUG not configured");
      return;
    }

    // Build checkout URL with pre-filled data
    const checkoutUrl = new URL(
      `https://${storeSlug}.lemonsqueezy.com/checkout/buy/${variantId}`
    );
    checkoutUrl.searchParams.set("checkout[email]", email);
    checkoutUrl.searchParams.set("checkout[name]", orgName);
    checkoutUrl.searchParams.set("checkout[custom][org_convex_id]", orgConvexId);

    // Open checkout overlay
    window.LemonSqueezy.Url.Open(checkoutUrl.toString());
  };

  return (
    <Button onClick={handleUpgrade} disabled={!isLoaded || disabled}>
      {children}
    </Button>
  );
}
