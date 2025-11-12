#!/bin/bash
# ========================
# SCRIPT DE CONFIGURAÇÃO DE E-MAIL
# ========================
# Execute este script para configurar as variáveis de ambiente do Django
# Estas variáveis são necessárias para o sistema de recuperação de senha funcionar

echo "=========================================="
echo "Configuração de E-mail para Recuperação de Senha"
echo "=========================================="
echo ""

# Opções de provedor
echo "Escolha seu provedor de e-mail:"
echo "1) Gmail"
echo "2) Outlook/Hotmail"
echo "3) SendGrid"
echo "4) Outro (SMTP manual)"
read -p "Opção (1-4): " provider

case $provider in
    1)
        echo ""
        echo "=== Gmail Setup ==="
        echo "Para usar Gmail, você precisa:"
        echo "1. Habilitar 'Verificação em 2 passos' na sua conta"
        echo "2. Gerar uma 'Senha de App' em: https://myaccount.google.com/apppasswords"
        echo "3. Usar essa senha, não sua senha normal"
        echo ""
        read -p "Digite seu e-mail Gmail: " email
        read -sp "Digite sua 'Senha de App' (será ocultada): " password
        echo ""
        
        # Exporta as variáveis
        export EMAIL_HOST=smtp.gmail.com
        export EMAIL_PORT=587
        export EMAIL_USE_TLS=True
        export EMAIL_HOST_USER=$email
        export EMAIL_HOST_PASSWORD=$password
        export DEFAULT_FROM_EMAIL=$email
        ;;
    2)
        echo ""
        echo "=== Outlook/Hotmail Setup ==="
        read -p "Digite seu e-mail Outlook: " email
        read -sp "Digite sua senha: " password
        echo ""
        
        export EMAIL_HOST=smtp-mail.outlook.com
        export EMAIL_PORT=587
        export EMAIL_USE_TLS=True
        export EMAIL_HOST_USER=$email
        export EMAIL_HOST_PASSWORD=$password
        export DEFAULT_FROM_EMAIL=$email
        ;;
    3)
        echo ""
        echo "=== SendGrid Setup ==="
        echo "Obtenha uma chave API em: https://app.sendgrid.com/"
        read -p "Digite sua chave SendGrid API: " api_key
        
        export EMAIL_HOST=smtp.sendgrid.net
        export EMAIL_PORT=587
        export EMAIL_USE_TLS=True
        export EMAIL_HOST_USER=apikey
        export EMAIL_HOST_PASSWORD=$api_key
        export DEFAULT_FROM_EMAIL=seu-email@seudominio.com
        ;;
    4)
        echo ""
        echo "=== SMTP Manual ==="
        read -p "Host SMTP: " host
        read -p "Porta: " port
        read -p "Usar TLS? (True/False): " tls
        read -p "Usuário: " user
        read -sp "Senha: " pwd
        echo ""
        
        export EMAIL_HOST=$host
        export EMAIL_PORT=$port
        export EMAIL_USE_TLS=$tls
        export EMAIL_HOST_USER=$user
        export EMAIL_HOST_PASSWORD=$pwd
        ;;
    *)
        echo "Opção inválida!"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "Variáveis de Ambiente Configuradas:"
echo "=========================================="
echo "EMAIL_HOST=$EMAIL_HOST"
echo "EMAIL_PORT=$EMAIL_PORT"
echo "EMAIL_USE_TLS=$EMAIL_USE_TLS"
echo "EMAIL_HOST_USER=$EMAIL_HOST_USER"
echo "DEFAULT_FROM_EMAIL=$DEFAULT_FROM_EMAIL"
echo ""
echo "⚠️  IMPORTANTE: Estas variáveis estão apenas na sessão atual"
echo "Para persistir, adicione ao seu arquivo .env ou ao shell profile"
echo ""
echo "Teste enviando um código de recuperação!"
