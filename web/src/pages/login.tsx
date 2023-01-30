import { Box, Button, Flex } from "@chakra-ui/react";
import { Formik, Form } from "formik";
import { useRouter } from "next/router";
import React from "react";
import { useMutation } from "urql";
import { InputField } from "../components/InputField";
import { Wrapper } from "../components/Wrapper";
import { toErrorMap } from "../utils/toErrorMap";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";
import NextLink from 'next/link';

const LOGIN_MUTATION = `
mutation Login($usernameOrEmail: String!, $password: String!) {
    login(usernameOrEmail: $usernameOrEmail, password: $password) {
        errors {
            field
            message
        }
        user {
            id
            username
        }
    }
}
`

const Login: React.FC<{}> = ({}) => {
    const router = useRouter();
  // allows us to use a graphql mutation (first value contains loading/fetching state but we dont need it)
  const [, login] = useMutation(LOGIN_MUTATION);
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ usernameOrEmail: "", password: "" }}
        onSubmit={async (values, {setErrors}) => {
          console.log(values);
          // registerUser mutation (returning promise stops the spinner)
          let response = await login(values);
          console.log(response)
          if (response.data?.login.errors) {
            setErrors(toErrorMap(response.data.login.errors))
          } else if (response.data.login.user) {
            // worked and redirect to home page
            router.push("/");
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            {/* single input field styled from Chakra */}
            <InputField
              name="usernameOrEmail"
              placeholder="Username or Email"
              label="Username or Email"
            />
            <Box mt={4}>
              <InputField
                type="password"
                name="password"
                placeholder="Password"
                label="Password"
              />
              <Flex mt={2}>
              <NextLink style={{textDecoration: "underline", marginLeft: "auto"}} href="/forgot-password">
                Forgot password?
              </NextLink>
              </Flex>
            </Box>
            <Button
              mt={4}
              type="submit"
              isLoading={isSubmitting}
              colorScheme="teal"
            >
              Login
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  )
};

export default withUrqlClient(createUrqlClient)(Login);
