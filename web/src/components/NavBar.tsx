import { Box, Button, Flex, Link } from "@chakra-ui/react";
import {useEffect} from "react";
import React from "react";
import NextLink from "next/link";
import { useMutation, useQuery } from "urql";
import { isServer } from "../utils/isServer";

interface NavbarProps {}

const ME_QUERY = `
query Me {
    me {
        id
        username
    }
}
`;

const LOGOUT = `
mutation {
    logout
  }
`

export const Navbar: React.FC<NavbarProps> = ({}) => {
  const [{fetching: logoutFetching}, logout] = useMutation(LOGOUT)
  const [{ data, fetching }] = useQuery({ 
    query: ME_QUERY,
    // dont run on server because we already have user from server-side rendering
    // pause: server
  });
  let body = null;

  console.log(data)

  if (fetching) {
    // loading
    return null;
  } else if (!data?.me) {
    console.log('here', data, fetching)
    // user not logged in
    body = (
        <>
            <NextLink style={{color:'white', marginRight:10}} href="/login">
                Login
            </NextLink>
            <NextLink style={{color:'white'}} href="/register">
                Register
            </NextLink>
        </>
    )
  } else {  
    console.log('logged in', data)
    // user logged in
    body = (<Flex>
         <Box color="white" mr={2}>{data.me.username}</Box>
         <Button color="white" variant="link" onClick={() => logout()} isLoading={logoutFetching}>Logout</Button>
    </Flex>
    )
       
  }

  return (
    <Flex bg="black" p={4}>
      <Box ml={"auto"}>
        {body}
      </Box>
    </Flex>
  );
};

export default Navbar;
