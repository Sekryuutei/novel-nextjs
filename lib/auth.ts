import {NextAuthOptions} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import {prisma} from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    session: {strategy: "jwt"},
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: {label: "Email", type: "email"},
                password: {label: "Password", type: "password"},
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: {email: credentials.email},
                });
                if (!user||!user.password) {
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );
                if (!isPasswordValid) {
                    return null;
                }
                return {id: user.id, email: user.email, name: user.name, role: user.role};
            }
        })
    ],
    callbacks: {
        async jwt({token, user}) {
            if (user) {
                token.id = user.id
                token.role = user.role
            }
            return token;
        },
        async session({session, token}) {
            if (token) {
                session.user.id = token.id as string
                session.user.role = token.role as string
                session.user.email = token.email
                session.user.name = token.name
            }
            return session;
        }
    },
    pages: {
        signIn: '/auth/login',
        signUp: '/auth/register'
    }
};
