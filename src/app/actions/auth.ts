"use server"

import { signIn } from "@/auth"
import { AuthError } from "next-auth"

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        const plainData = Object.fromEntries(formData.entries())
        await signIn("credentials", { ...plainData, redirectTo: "/" })
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return "Credenciais inválidas."
                default:
                    return "Ocorreu um erro no servidor de autenticação."
            }
        }
        throw error
    }
}
