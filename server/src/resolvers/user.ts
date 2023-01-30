import { User } from "../entities/User";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import { MyContext } from "../types";
import argon2 from "argon2";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { sendEmail } from "../utils/sendEmail";
import { validateRegister } from "../utils/validateRegister";
import { v4 } from "uuid";

// an alternative way to the @Arg() decorator to pass arguments into resolvers (see registerUser function)
@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;
  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

// use objectType for outputs and InputType for inputs
// outputting errors in this case so use ObjectType
@ObjectType()
class UserResponse {
  // return error if error exists in async call
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
  // return user if it works properly
  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { em, redis, req }: MyContext
  ): Promise<UserResponse> {
    if (newPassword.length <= 2) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "Password must be longer than 2 characters",
          },
        ],
      };
    }
    // get userId from redis
    const userId = await redis.get(FORGET_PASSWORD_PREFIX + token);
    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "Token expired",
          },
        ],
      };
    }
    const user = await em.findOne(User, { id: parseInt(userId) });
    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "User no longer exists",
          },
        ],
      };
    }
    // hash new password and update user
    user.password = await argon2.hash(newPassword);
    await em.persistAndFlush(user);
    // delete token from redis so user cannot use it again
    redis.del(FORGET_PASSWORD_PREFIX + token);
    // log user in after change password
    req.session.userId = user.id;
    return { user };
  }
  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { em, redis }: MyContext
  ) {
    const userExists = await em.findOne(User, { email });
    if (!userExists) {
      return false;
    }
    // create a token
    const token = v4();
    // store token in redis
    const res = await redis.set(
      FORGET_PASSWORD_PREFIX + token,
      userExists.id,
      "EX",
      1000 * 60 * 60 * 24 * 3
    );
    // send email with link to reset password
    await sendEmail(
      email,
      `<a href="http://localhost:3000/change-password/${token}">reset password</a>`
    );
    return true;
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() context: MyContext) {
    // not logged in
    if (!context.req.session.userId) {
      return null;
    }
    // logged in
    const user = await context.em.findOne(User, {
      id: context.req.session.userId,
    });
    console.log(context.req.session);
    return user;
  }

  @Query(() => [User])
  // @Ctx allows function to access the context of type MyContext (orm.em in this case)
  users(@Ctx() context: MyContext): Promise<User[]> {
    return context.em.find(User, {});
  }

  @Query(() => User, { nullable: true })
  user(
    // @Arg allows function to access the argument of type Int
    @Arg("id", () => Int) id: number,
    @Ctx() context: MyContext
  ): Promise<User | null> {
    return context.em.findOne(User, { id });
  }

  @Mutation(() => UserResponse)
  async registerUser(
    @Arg("username") username: string,
    @Arg("email") email: string,
    @Arg("password") password: string,
    // could alternatively do it like this:
    // @Arg('options': () => UsernamePasswordInput) options: UsernamePasswordInput,
    @Ctx() context: MyContext
  ): Promise<UserResponse> {
    const userExists = await context.em.findOne(User, { username });
    if (userExists) {
      return {
        errors: [
          {
            field: "username",
            message: "A user with this username already exists",
          },
        ],
      };
    }
    console.log("user exists");
    const errors = validateRegister(username, email, password);
    console.log("errors", errors);
    if (errors) {
      return { errors };
    }
    const hashedPassowrd = await argon2.hash(password);
    const user = context.em.create(User, {
      username,
      email,
      password: hashedPassowrd,
    } as User);
    // hash password using argon2 so that it is secure
    await context.em.persistAndFlush(user);
    // adding session for user (logs them in)
    context.req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() context: MyContext
  ): Promise<UserResponse> {
    const user = await context.em.findOne(
      User,
      usernameOrEmail.includes("@")
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail }
    );
    if (!user) {
      return {
        errors: [
          { field: "usernameOrEmail", message: "that username doesn't exist" },
        ],
      };
    }
    const valid = await argon2.verify(user.password, password);
    if (!valid) {
      return {
        errors: [{ field: "password", message: "Incorrect Password" }],
      };
    }
    // adding session for user
    // this is how we store the session in redis
    // redis key-value store looks something like: { session: hbchiwbehve -> {userId: 1} }
    context.req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }
        resolve(true);
      })
    );
  }
}
