import { Flex, Button, Box } from "@chakra-ui/react";
import { Formik, Form } from "formik";
import { withUrqlClient } from "next-urql";
import router from "next/router";
import React, { useState } from "react";
import { InputField } from "../components/InputField";
import { Wrapper } from "../components/Wrapper";
import { createUrqlClient } from "../utils/createUrqlClient";
import { toErrorMap } from "../utils/toErrorMap";
import login from "./login";
import NextLink from "next/link";
import { useMutation } from "urql";

const FORGOT_PASSWORD_MUTATION = `
mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email)
}
`;

const ForgotPassword: React.FC<{}> = ({}) => {
  const [complete, setComplete] = useState(false);
  const [, forgotPassword] = useMutation(FORGOT_PASSWORD_MUTATION);
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ email: "" }}
        onSubmit={async (values, { setErrors }) => {
          //   console.log(values);
          //   // registerUser mutation (returning promise stops the spinner)
          let response = await forgotPassword(values);
          setComplete(true);
          //   console.log(response)
          //   if (response.data?.login.errors) {
          //     setErrors(toErrorMap(response.data.login.errors))
          //   } else if (response.data.login.user) {
          //     // worked and redirect to home page
          //     router.push("/");
          //   }
        }}
      >
        {({ isSubmitting }) =>
          complete ? (
            <Box>
              If an account with that email exists, we sent you an email.
            </Box>
          ) : (
            <Form>
              {/* single input field styled from Chakra */}
              <InputField name="email" placeholder="email" label="Email" />
              <Button
                mt={4}
                type="submit"
                isLoading={isSubmitting}
                colorScheme="teal"
              >
                Forgot Password
              </Button>
            </Form>
          )
        }
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(ForgotPassword);
