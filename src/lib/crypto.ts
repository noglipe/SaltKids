import { toast } from "sonner";

var CryptoJS = require("crypto-js");

/**
 * Criptografa um texto usando o algoritmo AES (Advanced Encryption Standard).
 *
 * @param text O texto a ser criptografado.
 * @returns Uma string representando o texto criptografado.
 */


export function criptografarTexto(text: string): string {

    const key = process.env.NEXT_PUBLIC_KEY;
    try {
        const ciphertext = CryptoJS.AES.encrypt(text, key).toString();
        return ciphertext;
    } catch (error) {
        console.error("Erro durante a criptografia:", error);
        toast.error("Erro ao Criptografar")
        return "";
    }
}

/**
 * Descriptografa um texto criptografado usando o algoritmo AES.
 *
 * @param ciphertext O texto criptografado.
 * @returns O texto original descriptografado, ou vazio em caso de erro.
 */
export function descriptografarTexto(ciphertext: string): string {

    const key = process.env.NEXT_PUBLIC_KEY;

    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, key);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        return originalText;
    } catch (error) {
        console.error("Erro durante a descriptografia:", error);
        toast.error("Erro ao DeCriptografar")
        return ""; // Ou lance uma exceção, dependendo do seu tratamento de erro
    }
}