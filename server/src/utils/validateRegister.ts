export const validateRegister = (
  username: string,
  email: string,
  password: string
) => {
  if (!email.includes("@")) {
    return [
      {
        field: "email",
        message: "Please enter a valid email address",
      },
    ];
  } else if (username.length <= 2) {
    return [
      {
        field: "username",
        message: "Username must be longer than 2 characters",
      },
    ];
  } else if (username.includes("@")) {
    return [
      {
        field: "username",
        message: "Username cannot contain an @ symbol",
      },
    ];
  } else if (password.length <= 2) {
    return [
      {
        field: "password",
        message: "Password must be longer than 3 characters",
      },
    ];
  }
  return null;
};
