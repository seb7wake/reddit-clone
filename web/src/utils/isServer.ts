// if window variable is present, it means we are on the client side
export const isServer = () => typeof window === "undefined";
