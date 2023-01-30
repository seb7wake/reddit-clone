import { createClient, dedupExchange, fetchExchange, Provider } from "urql";
import { cacheExchange } from "@urql/exchange-graphcache";
import { MeDocument, MeQuery, UserResponse } from "../gql/graphql";
// import { createUrqlClient } from "next-urql";

export const createUrqlClient = (ssrExchange: any) => ({
  url: "http://localhost:4000/graphql",
  fetchOptions: {
    // include cookies with every request
    credentials: "include" as const,
  },
  exchanges: [
    dedupExchange,
    cacheExchange({
      updates: {
        Mutation: {
          logout: (result, args, cache, info) => {
            cache.updateQuery({ query: MeDocument }, (data: MeQuery) => {
              // set the user in cache to null
              return { me: null };
            });
          },
          login: (result: { login: UserResponse }, args, cache, info) => {
            cache.updateQuery({ query: MeDocument }, (data: MeQuery) => {
              if (result.login.errors) {
                return data;
              } else {
                // set the user in the cache
                return { me: result.login.user };
              }
            });
          },
          registerUser: (
            result: { registerUser: UserResponse },
            args,
            cache,
            info
          ) => {
            cache.updateQuery({ query: MeDocument }, (data: MeQuery) => {
              console.log("data result:", data, result);
              if (result.registerUser.errors) {
                console.log("errors", result.registerUser.errors);
                return data;
              } else {
                console.log("here");
                return { me: result.registerUser.user };
              }
            });
          },
        },
      },
    }),
    // add the ssrExchange to the client
    ssrExchange,
    fetchExchange,
  ],
});
