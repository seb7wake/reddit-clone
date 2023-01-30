import React from "react";
import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input,
  Button,
  Box,
} from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import { Wrapper } from "../components/Wrapper";
import { InputField } from "../components/InputField";
import { useMutation } from "urql";
import { toErrorMap } from "../utils/toErrorMap";
import { useRouter } from "next/router";
import {withUrqlClient} from 'next-urql';
import {createUrqlClient} from '../utils/createUrqlClient';

interface registerProps {}

const REGISTER_MUTATION = `
mutation Register($username: String!, $email: String!, $password: String!) {
  registerUser(username: $username, email: $email, password: $password) {
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

const Register: React.FC<registerProps> = ({}) => {
  const router = useRouter();
  // allows us to use a graphql mutation (first value contains loading/fetching state but we dont need it)
  const [, register] = useMutation(REGISTER_MUTATION);
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ username: "", email: "", password: "" }}
        onSubmit={async (values, {setErrors}) => {
          console.log(values);
          // registerUser mutation (returning promise stops the spinner)
          let response = await register(values);
          if (response.data?.registerUser.errors) {
            setErrors(toErrorMap(response.data.registerUser.errors))
          } else if (response.data.registerUser.user) {
            // worked and redirect to home page
            router.push("/");
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            {/* single input field styled from Chakra */}
            <InputField
              name="email"
              placeholder="Email"
              label="Email"
            />
            <Box mt={4}>
            <InputField
              name="username"
              placeholder="Username"
              label="Username"
            />
            </Box>
            <Box mt={4}>
              <InputField
                type="password"
                name="password"
                placeholder="Password"
                label="Password"
              />
            </Box>
            <Button
              mt={4}
              type="submit"
              isLoading={isSubmitting}
              colorScheme="teal"
            >
              Register
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(Register);
