# Firebase real e login com Google

O aplicativo usa Firebase somente quando o arquivo local `.env` define
`EXPO_PUBLIC_DATA_PROVIDER=firebase`. Copie `.env.example` para `.env` e
preencha nele a configuração pública do aplicativo Web criada no Console do
Firebase. Esse arquivo é ignorado pelo Git.

## Console do Firebase

1. Crie ou selecione o projeto Firebase e registre os aplicativos Web, Android
   e iOS do MatchPoint.
2. Em **Authentication > Sign-in method**, ative **E-mail/senha** e **Google**.
3. Em **Authentication > Settings > Authorized domains**, inclua o domínio da
   publicação web e `localhost` para desenvolvimento.
4. Em **Firestore Database** e **Storage**, crie os bancos no modo de produção.
5. Crie os clientes OAuth no Google Cloud para Web, Android e iOS. Informe os
   IDs em `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID`; nunca use client secret no app.

Para Android, o cliente OAuth precisa do package e SHA-1 do build. Para iOS,
use o bundle identifier do build. O redirect nativo configurado pelo app usa o
esquema `matchpoint`.

## Publicação das regras

Depois de instalar e autenticar a Firebase CLI na sua máquina, confira o
projeto ativo e publique as regras versionadas:

```bash
firebase use SEU_PROJECT_ID
firebase deploy --only firestore:rules,storage
```

Antes de uma demonstração, faça ao menos um cadastro por e-mail e um login
Google novo (com escolha de perfil) e um login Google já vinculado. A chave de
API do Firebase e os client IDs OAuth são identificadores públicos de app; a
proteção real está nas regras do Firestore/Storage, nos domínios autorizados e
na ausência de contas de serviço ou client secrets no cliente.
