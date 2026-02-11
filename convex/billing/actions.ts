'use node';

import { polar } from '../polar';

export const { generateCheckoutLink, generateCustomerPortalUrl, cancelCurrentSubscription, changeCurrentSubscription } =
  polar.api();

export const createCheckoutUrl = generateCheckoutLink;
export const getCustomerPortalUrl = generateCustomerPortalUrl;
export const cancelSubscription = cancelCurrentSubscription;
