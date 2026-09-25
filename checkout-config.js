const STRIPE_DONATION_CHECKOUT_URL = "https://buy.stripe.com/28EaEWguMf6Odiz2ergIo00";

window.CHIEF_CHECKOUT_LINKS = {
  starter: `${STRIPE_DONATION_CHECKOUT_URL}?prefilled_amount=2900`,
  standard: `${STRIPE_DONATION_CHECKOUT_URL}?prefilled_amount=4900`,
  pro: `${STRIPE_DONATION_CHECKOUT_URL}?prefilled_amount=9900`
};
