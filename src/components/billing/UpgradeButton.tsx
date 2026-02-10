import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { getCheckoutUrl, isPlanAvailable } from "@/config/billing";

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
  planId: string;
  email: string;
  orgName: string;
  orgConvexId: string;
  disabled?: boolean;
  children?: ReactNode;
}

export function UpgradeButton({
  planId,
  email,
  orgName,
  orgConvexId,
  disabled,
  children = "Upgrade Plan",
  onClick,
  ...props
}: UpgradeButtonProps & React.ComponentProps<typeof Button>) {
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
    if (!isLoaded || !window.LemonSqueezy) {
      toast.error("Payment system is loading. Please try again in a moment.");
      return;
    }

    // Check if plan is available
    if (!isPlanAvailable(planId)) {
      toast.error("This plan is not available. Please contact support.");
      return;
    }

    // Get checkout URL from config
    const checkoutUrl = getCheckoutUrl(planId, {
      email,
      orgName,
      orgConvexId,
    });

    if (!checkoutUrl) {
      toast.error("Unable to start checkout. Please try again later.");
      return;
    }

    // Open checkout overlay
    window.LemonSqueezy.Url.Open(checkoutUrl);
  };

  return (
    <Button
      onClick={(e) => {
        handleUpgrade();
        onClick?.(e);
      }}
      disabled={!isLoaded || disabled}
      {...props}
    >
      {children}
    </Button>
  );
}
