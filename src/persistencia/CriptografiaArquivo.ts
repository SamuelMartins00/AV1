import {
    createCipheriv,
    createDecipheriv,
    createHash,
    randomBytes
} from "crypto";

export class CriptografiaArquivo {

    cifrar(dados: string, chave: string): string {
        const chaveNormalizada = this.obterChave(chave);

        // GCM utiliza um IV aleatório.
        const iv = randomBytes(12);

        const cipher = createCipheriv(
            "aes-256-gcm",
            chaveNormalizada,
            iv
        );

        const dadosCriptografados = Buffer.concat([
            cipher.update(dados, "utf8"),
            cipher.final()
        ]);

        const authTag = cipher.getAuthTag();

        return JSON.stringify({
            iv: iv.toString("base64"),
            authTag: authTag.toString("base64"),
            dados: dadosCriptografados.toString("base64")
        });
    }

    decifrar(
        dadosCifrados: string,
        chave: string
    ): string {
        const chaveNormalizada = this.obterChave(chave);

        let pacote: {
            iv: string;
            authTag: string;
            dados: string;
        };

        try {
            pacote = JSON.parse(dadosCifrados);
        } catch {
            throw new Error(
                "Arquivo criptografado possui formato inválido."
            );
        }

        try {
            const iv = Buffer.from(
                pacote.iv,
                "base64"
            );

            const authTag = Buffer.from(
                pacote.authTag,
                "base64"
            );

            const dados = Buffer.from(
                pacote.dados,
                "base64"
            );

            const decipher = createDecipheriv(
                "aes-256-gcm",
                chaveNormalizada,
                iv
            );

            decipher.setAuthTag(authTag);

            const dadosDecifrados = Buffer.concat([
                decipher.update(dados),
                decipher.final()
            ]);

            return dadosDecifrados.toString("utf8");
        } catch {
            throw new Error(
                "Não foi possível decifrar o arquivo. " +
                "A chave pode estar incorreta ou o conteúdo foi alterado."
            );
        }
    }

    gerarChave(): string {
        return randomBytes(32).toString("base64");
    }

    private obterChave(chave: string): Buffer {
        return createHash("sha256")
            .update(chave, "utf8")
            .digest();
    }
}