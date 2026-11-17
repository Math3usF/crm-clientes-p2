# CRM de clientes — P2 de Laboratório de Programação Front End

CRM para uma pequena empresa: o atendente entra com login e gerencia **clientes**, **pedidos** e o **histórico de atendimento** (ligações, e-mails e conversas).

Prova prática P2 · 2026.2 · Prof.ª Laís Cristine Bordallo Pinheiro · Universidade de Vassouras.

> **Repositório:** https://github.com/Math3usF/crm-clientes-p2
> (o mesmo link vai no AVA)

---

## Tecnologias

- **React 18 + TypeScript + Vite 5**
- **React Router 7** (rotas protegidas, volta para a página tentada)
- **Axios** (uma única instância de API com token no header)
- **Context** para autenticação
- CSS próprio, responsivo a partir de 375 px

## Como rodar

O app consome o **servidor-crm** entregue pela professora. Ele não faz parte deste repositório.

### 1. Servidor (terminal 1)

```bash
cd servidor-crm
npm install
npm start          # http://localhost:3333
```

Deixe o terminal aberto. Se estragar os dados, pare o servidor e rode `npm run reset`.

### 2. App (terminal 2)

```bash
npm install
npm run dev        # http://localhost:5173
```

O endereço da API vem do `.env` na raiz do projeto:

```
VITE_API_URL=http://localhost:3333
```

Se mudar o `.env`, reinicie o `npm run dev`. Nenhuma URL de API está fixa no código.

### Conta de teste

- usuário: `emilys`
- senha: `emilyspass`

### Build de produção

```bash
npm run build      # tsc --noEmit + vite build, sem erros
npm run preview
```

---

## Telas e rotas

| Rota | Tela | O que faz |
|---|---|---|
| `/login` | Login | usuário e senha, erro na tela, volta para a página tentada |
| `/` | Painel | total de clientes, total vendido, ticket médio, pedidos por status, Top 3, atalhos |
| `/clientes` | Lista de clientes | busca por nome/e-mail (com debounce), 5 por página, selo e total de cada um |
| `/clientes/novo` | Novo cliente | validação antes de enviar |
| `/clientes/:id` | Detalhe | dados, selo, editar, excluir com contagem, pedidos e histórico |
| `/clientes/:id/editar` | Editar cliente | validação antes de enviar |
| `/pedidos` | Todos os pedidos | nome do cliente, filtros por status e faixa de valor, ordenação por data/total |
| `*` | Não encontrada | aviso com link para o Painel |

Menu: **Painel · Clientes · Pedidos · Novo cliente · Sair**, com o nome de quem está logado vindo de `/auth/me`.

## Regras de negócio implementadas

- **Total do pedido** = soma de `preco × quantidade` dos itens (calculado no app; a API não manda o total).
- **Pedidos cancelados** ficam fora do total vendido, do ticket médio, do selo e do Top 3.
- **Selo:** `VIP` com R$ 2.000,00 ou mais em compras válidas; `Sem compras` sem nenhum pedido válido; senão `Regular`. Aparece na lista e no detalhe.
- **Status:** `aberto → pago | cancelado`, `pago → cancelado`, `cancelado` não muda mais (sem botões).
- **Itens:** só pedido `aberto` permite editar.
- **Excluir cliente:** a confirmação informa quantos pedidos e atendimentos serão apagados junto.
- **Atendimentos:** do mais recente para o mais antigo, com filtro por canal e contador que acompanha o filtro.
- **Top 3:** os três maiores totais comprados, do maior para o menor, com nome e valor.

## Organização do código

```
src/
├── components/      # Header, Layout, estados (carregando/erro/vazio), selo, status,
│                    # editor de itens, pedidos e atendimentos do cliente
├── contexts/        # AuthContext (token, usuário, login, logout, sessão expirada)
├── pages/           # Login, Painel, Clientes, ClienteDetalhe, ClienteForm, Pedidos, NaoEncontrada
├── routes/          # ProtectedRoute
├── services/        # http (Axios + interceptors), auth, clientes, pedidos, atendimentos,
│                    # normalizar (adapta a resposta da API aos tipos do app)
├── utils/           # calculos (funções puras), formato, erros, rotulos, validacao
└── types.ts
```

**Cálculos em funções puras:** `totalDoPedido`, `totalDoCliente`, `seloDoCliente`, `resumoPainel`, `topClientes`, `filtrarPedidos`, `ordenarPedidos`, `filtrarAtendimentos` e `ordenarAtendimentos` ficam em `src/utils/calculos.ts`. O Painel, a lista, o detalhe e a tela de pedidos usam as mesmas funções — por isso os números sempre batem. `map`, `filter`, `reduce` e `sort` trabalham sobre cópias, sem mutar o estado.

## Login, sessão e erros

- O token fica no `localStorage` (`crm.token`) e é enviado em todas as chamadas pelo interceptor do Axios.
- `401` em qualquer rota encerra a sessão e leva ao Login com o aviso “Sua sessão expirou”.
- Rota protegida sem sessão guarda o destino e volta para ele depois do login.
- Login inválido: mensagem na tela, sem sair da página.
- Todas as chamadas usam `try/catch/finally` com `setCarregando(false)` no `finally`.
- Mensagens amigáveis para **400, 401, 404, 409, 500 e servidor desligado** (o texto do servidor em `message` é reaproveitado quando faz sentido).
- Estados de **carregando**, **erro** (com “Tentar de novo”) e **vazio** em todas as listas.

## Celular (375 px)

Layout em coluna, botões com área de toque de 44 px, tabelas substituídas por listas de cartões e quebra de texto nos e-mails. Testado em todas as rotas com 375 px de largura: `scrollWidth === clientWidth`, sem rolagem lateral.

## Checklist da prova

- [x] Login com token, rotas protegidas, Sair e volta para a página tentada
- [x] Clientes: busca, paginação de 5 em 5, detalhe, criar, editar e excluir com contagem
- [x] Pedidos: total calculado, criar, editar itens, status com as regras, excluir
- [x] Atendimentos: listar, filtrar por canal com contador, criar, editar e excluir
- [x] Painel: total vendido, ticket médio, pedidos por status, Top 3 e selo
- [x] Todos os pedidos: nome do cliente, filtros por status/faixa e ordenação
- [x] Carregando / erro / vazio e lista atualizada após salvar
- [x] `/xyz` e `/clientes/999` com aviso na tela
- [x] 375 px sem rolagem lateral
- [x] TypeScript e `npm run build` sem erros
- [x] Console sem erro de JavaScript (só as linhas de rede dos 400/401/404/409 testados de propósito)

## Observações

- A pasta `servidor-crm` e o `node_modules` **não** entram no ZIP nem no repositório.
- O `.env` está versionado com a URL local padrão do servidor; ajuste se a porta mudar.
- Projeto individual, feito para a P2. O uso de IA era permitido pela prova.
