# 📧 Configuração de E-mail para Recuperação de Senha

## Status Atual

✅ **Sistema operacional com e-mail no TERMINAL (console)**
- Os códigos de recuperação aparecem no terminal do Django
- Perfeito para desenvolvimento e testes
- Pronto para mudar para e-mail real quando necessário

---

## 🔄 Como Recuperar Senha Atualmente

1. Acesse o frontend
2. Clique em "Esqueci a Senha"
3. Digite um e-mail registrado
4. **Verifique o terminal onde o Django está rodando**
5. Copie o código que aparece no terminal
6. Volte ao frontend e digite o código

---

## 🚀 Para Ativar E-mail Real (Futuro)

Quando precisar enviar e-mails reais, siga estes passos:

### 1. Editar `escola/settings.py`

Descomente as linhas do backend SMTP:

```python
# Mude de:
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Para:
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', 'seu-email@gmail.com')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', 'sua-senha-app')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER)
```

### 2. Configurar Variáveis de Ambiente

#### ✅ **Gmail (Recomendado)**
- **Vantagem**: Grátis, fácil de configurar
- **Desvantagem**: Requer "Senha de App"

**Passos**:
1. Acesse sua conta Google: https://myaccount.google.com/
2. Ative "Verificação em 2 passos"
3. Gere uma "Senha de App": https://myaccount.google.com/apppasswords
4. Copie a senha gerada (será algo como: `qwer tyui asdf ghjk`)

#### ✅ **Outlook/Hotmail**
- Semelhante ao Gmail
- Acesse: https://outlook.live.com/

#### ✅ **SendGrid**
- Serviço profissional
- Até 100 e-mails grátis por dia
- Acesse: https://sendgrid.com/

---

### 2. Configurar Variáveis de Ambiente

#### **Gmail (Recomendado)**

1. Acesse sua conta Google: https://myaccount.google.com/
2. Ative "Verificação em 2 passos"
3. Gere uma "Senha de App": https://myaccount.google.com/apppasswords
4. Configure as variáveis de ambiente:

**Windows PowerShell:**
```powershell
[Environment]::SetEnvironmentVariable("EMAIL_HOST", "smtp.gmail.com", "User")
[Environment]::SetEnvironmentVariable("EMAIL_PORT", "587", "User")
[Environment]::SetEnvironmentVariable("EMAIL_USE_TLS", "True", "User")
[Environment]::SetEnvironmentVariable("EMAIL_HOST_USER", "seu-email@gmail.com", "User")
[Environment]::SetEnvironmentVariable("EMAIL_HOST_PASSWORD", "sua-senha-app", "User")
[Environment]::SetEnvironmentVariable("DEFAULT_FROM_EMAIL", "seu-email@gmail.com", "User")
```

**Linux/macOS:**
```bash
export EMAIL_HOST=smtp.gmail.com
export EMAIL_PORT=587
export EMAIL_USE_TLS=True
export EMAIL_HOST_USER=seu-email@gmail.com
export EMAIL_HOST_PASSWORD=sua-senha-app
export DEFAULT_FROM_EMAIL=seu-email@gmail.com
```

#### **Outlook (Alternativa)**

```
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=seu-email@outlook.com
EMAIL_HOST_PASSWORD=sua-senha
```

#### **SendGrid (Serviço Profissional)**

```
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=SG.chave_api_aqui
```

### 3. Reiniciar o Servidor Django

Depois de descomentar o código e configurar as variáveis:

```bash
# Ctrl+C para parar o servidor atual
python manage.py runserver
```

### 4. Testar

1. Acesse o frontend
2. Clique em "Esqueci a Senha"
3. Digite um e-mail
4. **Verifique seu e-mail** (em vez do terminal)

---

## ✅ Checklist para Ativar E-mail Real

- [ ] Descomentou o código SMTP em `settings.py`
- [ ] Escolheu um provedor (Gmail recomendado)
- [ ] Obteve as credenciais
- [ ] Configurou as variáveis de ambiente
- [ ] Reiniciou o servidor Django
- [ ] Testou enviando um código
- [ ] Recebeu o código por e-mail

---

## � Notas de Segurança

⚠️ **Importante:**
- Nunca coloque senhas em código ou Git
- Use variáveis de ambiente
- Se usar `.env`, adicione ao `.gitignore`
- Gmail: use "Senha de App", não a senha da conta

---

## 📞 Suporte

Se tiver dúvidas ao ativar e-mail real, veja:
- Gmail: https://support.google.com/accounts/answer/185833
- Outlook: https://support.microsoft.com/
- SendGrid: https://docs.sendgrid.com/

