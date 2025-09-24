# 📱 Configuração de Ícones - Agenda Lina

## ✅ O que foi feito:

1. **app.json atualizado** para usar `./src/assets/logo.jpeg`
2. **Nome do app** alterado para "Agenda Lina"
3. **Splash screen** configurado com a logo e fundo azul (#191970)
4. **Ícones** configurados para iOS, Android e Web

## 🎨 Configurações aplicadas:

### App Info:
- **Nome**: "Agenda Lina" 
- **Slug**: "agenda-lina"
- **Ícone**: Logo da escola

### Cores:
- **Background splash**: #191970 (azul escuro)
- **Background Android**: #191970 (consistente)

## 🚀 Para melhor qualidade (Opcional):

Se quiser ícones de alta qualidade, crie estas versões da logo:

### Tamanhos recomendados:
- **Ícone principal**: 1024x1024px (formato PNG)
- **Splash screen**: 1242x2436px (formato PNG)
- **Adaptive icon**: 1024x1024px (formato PNG)

### Como criar:
1. Abra o `logo.jpeg` em um editor de imagem
2. Redimensione para 1024x1024px mantendo a proporção
3. Salve como PNG na pasta `assets/`
4. Atualize o `app.json` para usar os novos arquivos

## 📲 Como testar:

1. Reinicie o servidor Expo: `npx expo start --clear`
2. Recompile o app no seu dispositivo
3. O novo ícone aparecerá na tela inicial do dispositivo

## 💡 Dicas:

- **JPEG funciona** mas PNG tem melhor qualidade
- **Fundo transparente** no PNG fica mais profissional
- **Tamanho quadrado** é obrigatório para ícones de app
- **Alta resolução** evita pixelização em telas grandes