"use client";

import {useState,useEffect, use} from "react";
import {sigIn, getSession} from "next-auth/react";
import {useRouter, useSearchParams} from "next/navigation";
import Link from "next/link";
import { LoginFormData } from "@/types";
import { email, set } from "zod";

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
    const message = searchParams.get("message");
    
    const [formData, setFormData] = useState<LoginFormData>({
        email: "",
        password: "",
    });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        if (message) {
            setSuccessMessage(decodeURIComponent(message));
        }
    }, [message]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (error) {
            setError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

try {
    const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
    });

    if (result?.error) {
        if (result.error.includes("password")) {
            setError("Password yang Anda masukkan salah.");
        } else if (result.error.includes("tidak ditemukan")) {
            setError("Email tidak ditemukan. Silakan daftar terlebih dahulu.");
        } else {
            setError("Terjadi kesalahan saat login. Silakan coba lagi.");
        }
    } else {
        router.push(callbackUrl);
        router.refresh();
    }
} catch (error) {
    console.error("Login error:", error);
    setError("Terjadi kesalahan saat login. Silakan coba lagi.");
} finally {
    setIsLoading(false);
}
};
    return (
        <div className="w-full max-w-md">
            
        </div>"


}
    };