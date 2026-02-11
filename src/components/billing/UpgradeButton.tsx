import { useAction } from 'convex/react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';

interface UpgradeButtonProps {
  productKey: string;
  disabled?: boolean;
  children?: ReactNode;
}

export function UpgradeButton({
  productKey,
  disabled,
  children = 'Upgrade Plan',
  onClick,
  ...props
}: UpgradeButtonProps & React.ComponentProps<typeof Button>) {
  const generateCheckout = useAction(api.billing.actions.createCheckoutUrl);

  const handleUpgrade = async () => {
    if (!productKey) {
      toast.error('This plan is not available. Please contact support.');
      return;
    }

    try {
      const result = await generateCheckout({ productKey });
      if (result?.url) {
        window.location.href = result.url;
      } else {
        toast.error('Unable to start checkout. Please try again later.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start checkout.';
      toast.error(message);
    }
  };

  return (
    <Button
      onClick={async (event) => {
        await handleUpgrade();
        onClick?.(event);
      }}
      disabled={disabled}
      {...props}
    >
      {children}
    </Button>
  );
}
