import { Box, Button, Link } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { NextPage } from "next";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { useMutation } from "urql";
import { InputField } from "../../components/InputField";
import { Wrapper } from "../../components/Wrapper";
import { createUrqlClient } from "../../utils/createUrqlClient";
import { toErrorMap } from "../../utils/toErrorMap";
import NextLink from 'next/link';

const CHANGE_PASSWORD_MUTATION = `
mutation ChangePassword($newPassword: String!, $token: String!) {
  changePassword(newPassword: $newPassword, token: $token) {
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
`;

export const ChangePassword: NextPage<{ token: string }> = ({ token }) => {
  const router = useRouter();
  const [, changePassword] = useMutation(CHANGE_PASSWORD_MUTATION);
  const [tokenError, setTokenError] = useState("")
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ newPassword: "" }}
        onSubmit={async (values, { setErrors }) => {
          console.log(values);
          // registerUser mutation (returning promise stops the spinner)
          console.log(values, token)
          let response = await changePassword({newPassword: values.newPassword, token});
          console.log(response)
          if (response.data?.changePassword.errors) {
            const errorMap = toErrorMap(response.data.changePassword.errors);
            if ("token" in errorMap) {
              setTokenError(errorMap.token)
            }
            setErrors(errorMap)
          } else if (response.data.changePassword.user) {
            // worked and redirect to home page
            router.push("/");
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            {/* single input field styled from Chakra */}
            <InputField
              type="password"
              name="newPassword"
              placeholder="new password"
              label="New Password"
            />
            {tokenError ? 
            <Box>
              <NextLink style={{textDecoration: "underline"}} href="/forgot-password">
                Click here for new token
              </NextLink>
            <Box color="red">{tokenError}</Box> 
            </Box>
            : null}
            <Button
              mt={4}
              type="submit"
              isLoading={isSubmitting}
              colorScheme="teal"
            >
              Submit
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

// allows us to get any query parameters from the url and pass it to the component
ChangePassword.getInitialProps = async ({ query }) => {
  return { token: query.token as string };
};

export default withUrqlClient(createUrqlClient)(ChangePassword);
