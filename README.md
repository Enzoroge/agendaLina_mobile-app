# 📱 Sistema de Agenda Escolar - Mobile App

Sistema mobile de gestão escolar desenvolvido com React Native e Expo, oferecendo funcionalidades completas para professores, alunos e responsáveis.

## 🚀 Tecnologias Utilizadas

- **React Native** - Framework para desenvolvimento mobile
- **Expo** - Plataforma para desenvolvimento e deploy
- **TypeScript** - Linguagem principal
- **React Navigation** - Navegação entre telas
- **Async Storage** - Armazenamento local
- **Axios** - Cliente HTTP para API
- **Vector Icons** - Ícones do projeto

## 🎯 Funcionalidades Principais

### 👨‍🏫 **Para Professores**
- ✅ Login e autenticação
- ✅ Gerenciamento de disciplinas
- ✅ Criação e edição de avisos
- ✅ Visualização de turmas
- ✅ Controle de alunos
- ✅ Dashboard administrativo

### 👨‍🎓 **Para Alunos**
- ✅ Acesso a avisos da escola
- ✅ Visualização de disciplinas
- ✅ Consulta de informações acadêmicas
- ✅ Interface personalizada por tipo de usuário

### 👥 **Para Responsáveis**
- ✅ Cadastro e autenticação
- ✅ Acompanhamento de informações dos alunos
- ✅ Acesso a avisos importantes
- ✅ Gestão de dados de contato

### 🔐 **Sistema de Autenticação**
- ✅ Login seguro com JWT
- ✅ Controle de acesso por roles (ADMIN, PROFESSOR, ALUNO, RESPONSAVEL)
- ✅ Proteção de rotas sensíveis
- ✅ Cadastro de novos usuários

## 📁 Estrutura do Projeto

```
src/
├── contexts/          # Contextos React (AuthContext)
├── pages/             # Telas do aplicativo
│   ├── SignIn/        # Tela de login
│   ├── SignUp/        # Tela de cadastro
│   ├── Dashboard/     # Dashboard principal
│   ├── Avisos/        # Gestão de avisos
│   ├── Professores/   # Gestão de professores
│   └── Responsaveis/  # Gestão de responsáveis
├── routes/            # Configuração de rotas
│   ├── app.routes.tsx # Rotas principais
│   ├── auth.routes.tsx# Rotas de autenticação
│   └── index.tsx      # Configuração geral
├── services/          # Serviços de API
└── assets/           # Recursos estáticos
```

## 🛠️ Como Executar o Projeto

### Pré-requisitos
- Node.js (versão 16+)
- Expo CLI
- Android Studio ou Xcode (para emuladores)
- Expo Go (para dispositivos físicos)

### Instalação
```bash
# Clone o repositório
git clone [URL_DO_REPOSITORIO]

# Navegue para o diretório
cd agenda-mobile-app

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npx expo start
```

### 📱 **Executando no Dispositivo**
1. Instale o **Expo Go** no seu smartphone
2. Execute `npx expo start`
3. Escaneie o QR code com o Expo Go (Android) ou Camera (iOS)

## 🌐 API Backend

O app se conecta com uma API REST que deve estar rodando em:
- **URL**: `http://192.168.0.52:3333`
- **Endpoints principais**:
  - `POST /login` - Autenticação
  - `POST /users` - Criação de usuários
  - `POST /responsavel` - Criação de responsáveis
  - `GET /avisos` - Listagem de avisos
  - E muitos outros...

## 🔧 Configuração do Ambiente

### Variáveis de Ambiente
Certifique-se de configurar a URL da API no arquivo `src/services/api.ts`:

```typescript
const api = axios.create({
    baseURL: 'http://SEU_IP:3333'  // Altere para seu IP
})
```

## 🎨 Interface e UX

- **Design responsivo** adaptado para diferentes tamanhos de tela
- **Navegação intuitiva** com tabs e stack navigation
- **Feedback visual** com loading states e mensagens de erro
- **Tema consistente** com cores e tipografia padronizadas
- **Ícones modernos** usando Feather Icons

## 🚀 Status do Desenvolvimento

- ✅ **Autenticação** - Completa com múltiplos tipos de usuário
- ✅ **Navegação** - Sistema de rotas implementado
- ✅ **Responsáveis** - CRUD completo
- ✅ **Dashboard** - Interface principal funcionando
- ✅ **Avisos** - Gestão de comunicados
- 🔄 **Testes** - Em desenvolvimento
- 🔄 **Deploy** - Configuração em andamento

## 👥 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Contato

Para dúvidas ou sugestões sobre o projeto, entre em contato!

---

⭐ **Se este projeto te ajudou, considere dar uma estrela!** ⭐