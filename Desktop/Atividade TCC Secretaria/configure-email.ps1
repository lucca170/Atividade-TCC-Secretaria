# ========================================
# SCRIPT DE CONFIGURAÇÃO DE E-MAIL (Windows PowerShell)
# ========================================
# Execute este script para configurar as variáveis de ambiente do Django
# Estas variáveis são necessárias para o sistema de recuperação de senha funcionar

Write-Host "=========================================="
Write-Host "Configuração de E-mail para Recuperação de Senha"
Write-Host "=========================================="
Write-Host ""

# Opções de provedor
Write-Host "Escolha seu provedor de e-mail:"
Write-Host "1) Gmail"
Write-Host "2) Outlook/Hotmail"
Write-Host "3) SendGrid"
Write-Host "4) Outro (SMTP manual)"
$provider = Read-Host "Opção (1-4)"

switch ($provider) {
    "1" {
        Write-Host ""
        Write-Host "=== Gmail Setup ==="
        Write-Host "Para usar Gmail, você precisa:"
        Write-Host "1. Habilitar 'Verificação em 2 passos' na sua conta"
        Write-Host "2. Gerar uma 'Senha de App' em: https://myaccount.google.com/apppasswords"
        Write-Host "3. Usar essa senha, não sua senha normal"
        Write-Host ""
        $email = Read-Host "Digite seu e-mail Gmail"
        $password = Read-Host "Digite sua 'Senha de App'" -AsSecureString
        $password_plain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($password))
        
        # Define as variáveis
        [Environment]::SetEnvironmentVariable("EMAIL_HOST", "smtp.gmail.com", "User")
        [Environment]::SetEnvironmentVariable("EMAIL_PORT", "587", "User")
        [Environment]::SetEnvironmentVariable("EMAIL_USE_TLS", "True", "User")
        [Environment]::SetEnvironmentVariable("EMAIL_HOST_USER", $email, "User")
        [Environment]::SetEnvironmentVariable("EMAIL_HOST_PASSWORD", $password_plain, "User")
        [Environment]::SetEnvironmentVariable("DEFAULT_FROM_EMAIL", $email, "User")
        
        # Define na sessão atual também
        $env:EMAIL_HOST = "smtp.gmail.com"
        $env:EMAIL_PORT = "587"
        $env:EMAIL_USE_TLS = "True"
        $env:EMAIL_HOST_USER = $email
        $env:EMAIL_HOST_PASSWORD = $password_plain
        $env:DEFAULT_FROM_EMAIL = $email
    }
    "2" {
        Write-Host ""
        Write-Host "=== Outlook/Hotmail Setup ==="
        $email = Read-Host "Digite seu e-mail Outlook"
        $password = Read-Host "Digite sua senha" -AsSecureString
        $password_plain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($password))
        
        [Environment]::SetEnvironmentVariable("EMAIL_HOST", "smtp-mail.outlook.com", "User")
        [Environment]::SetEnvironmentVariable("EMAIL_PORT", "587", "User")
        [Environment]::SetEnvironmentVariable("EMAIL_USE_TLS", "True", "User")
        [Environment]::SetEnvironmentVariable("EMAIL_HOST_USER", $email, "User")
        [Environment]::SetEnvironmentVariable("EMAIL_HOST_PASSWORD", $password_plain, "User")
        [Environment]::SetEnvironmentVariable("DEFAULT_FROM_EMAIL", $email, "User")
        
        $env:EMAIL_HOST = "smtp-mail.outlook.com"
        $env:EMAIL_PORT = "587"
        $env:EMAIL_USE_TLS = "True"
        $env:EMAIL_HOST_USER = $email
        $env:EMAIL_HOST_PASSWORD = $password_plain
        $env:DEFAULT_FROM_EMAIL = $email
    }
    "3" {
        Write-Host ""
        Write-Host "=== SendGrid Setup ==="
        Write-Host "Obtenha uma chave API em: https://app.sendgrid.com/"
        $api_key = Read-Host "Digite sua chave SendGrid API"
        
        [Environment]::SetEnvironmentVariable("EMAIL_HOST", "smtp.sendgrid.net", "User")
        [Environment]::SetEnvironmentVariable("EMAIL_PORT", "587", "User")
        [Environment]::SetEnvironmentVariable("EMAIL_USE_TLS", "True", "User")
        [Environment]::SetEnvironmentVariable("EMAIL_HOST_USER", "apikey", "User")
        [Environment]::SetEnvironmentVariable("EMAIL_HOST_PASSWORD", $api_key, "User")
        [Environment]::SetEnvironmentVariable("DEFAULT_FROM_EMAIL", "seu-email@seudominio.com", "User")
        
        $env:EMAIL_HOST = "smtp.sendgrid.net"
        $env:EMAIL_PORT = "587"
        $env:EMAIL_USE_TLS = "True"
        $env:EMAIL_HOST_USER = "apikey"
        $env:EMAIL_HOST_PASSWORD = $api_key
        $env:DEFAULT_FROM_EMAIL = "seu-email@seudominio.com"
    }
    "4" {
        Write-Host ""
        Write-Host "=== SMTP Manual ==="
        $host = Read-Host "Host SMTP"
        $port = Read-Host "Porta"
        $tls = Read-Host "Usar TLS? (True/False)"
        $user = Read-Host "Usuário"
        $password = Read-Host "Senha" -AsSecureString
        $password_plain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($password))
        
        [Environment]::SetEnvironmentVariable("EMAIL_HOST", $host, "User")
        [Environment]::SetEnvironmentVariable("EMAIL_PORT", $port, "User")
        [Environment]::SetEnvironmentVariable("EMAIL_USE_TLS", $tls, "User")
        [Environment]::SetEnvironmentVariable("EMAIL_HOST_USER", $user, "User")
        [Environment]::SetEnvironmentVariable("EMAIL_HOST_PASSWORD", $password_plain, "User")
        
        $env:EMAIL_HOST = $host
        $env:EMAIL_PORT = $port
        $env:EMAIL_USE_TLS = $tls
        $env:EMAIL_HOST_USER = $user
        $env:EMAIL_HOST_PASSWORD = $password_plain
    }
    default {
        Write-Host "Opção inválida!"
        exit 1
    }
}

Write-Host ""
Write-Host "=========================================="
Write-Host "Variáveis de Ambiente Configuradas:"
Write-Host "=========================================="
Write-Host "EMAIL_HOST=$env:EMAIL_HOST"
Write-Host "EMAIL_PORT=$env:EMAIL_PORT"
Write-Host "EMAIL_USE_TLS=$env:EMAIL_USE_TLS"
Write-Host "EMAIL_HOST_USER=$env:EMAIL_HOST_USER"
Write-Host "DEFAULT_FROM_EMAIL=$env:DEFAULT_FROM_EMAIL"
Write-Host ""
Write-Host "✓ Variáveis configuradas com sucesso!"
Write-Host "Pode fechar este PowerShell e reiniciar o servidor Django"
Write-Host ""
Write-Host "Teste enviando um código de recuperação!"
