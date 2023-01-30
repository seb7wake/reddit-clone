import NavBar from "../components/NavBar";
import dynamic from "next/dynamic";
import React from "react";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { useQuery } from "urql";

const POSTS = `
query Posts {
  posts {
    id
    title
    updatedAt
    createdAt
  }
}
`;

const Index = () => {
  const [{ data, fetching }] = useQuery({ query: POSTS });
  return (
    <>
      <NavBar />
      {fetching ? (
        <div>loading...</div>
      ) : (
        data.posts.map((post) => <div key={post.id}>{post.title}</div>)
      )}
    </>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: false })(Index);
