import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";

const client = new ApolloClient({
  link: new HttpLink({
    uri: "https://m3-backend.fly.dev/api/graphql",
    // uri: "http://localhost:4000/api/graphql",
  }),
  cache: new InMemoryCache(),
});

export const GraphQLProvider = ({ children }: { children: React.ReactNode }) => {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};
