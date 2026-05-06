"use server";

type LoginResult = {
  success?: boolean;
  error?: string;
  redirectTo?: string;
};

export async function login(formData: FormData): Promise<LoginResult> {
  try {
    const email = formData.get("email");
    const senha = formData.get("senha");

    if (email === "admin@teste.com" && senha === "123456") {
      return {
        success: true,
        redirectTo: "/admin/coleta",
      };
    }

    return {
      error: "Credenciais inválidas",
    };
  } catch (err: any) {
    return {
      error: err.message || "Erro no login",
    };
  }
}