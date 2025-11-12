"""
Django settings para o projeto 'escola' (Secretaria Web).

Arquivo de configuração central do Django.
Define banco de dados, apps instalados, middleware, templates, autenticação, e-mail, etc.

Para mais informações:
- https://docs.djangoproject.com/en/5.0/topics/settings/

Estrutura:
1. Paths e segurança
2. Apps instalados
3. Middleware
4. Templates
5. Banco de dados
6. Autenticação e autorização
7. Email
8. Cache
9. Validadores de senha
"""

from pathlib import Path
import os

# ========================
# PATHS (Caminhos do Projeto)
# ========================
# BASE_DIR: diretório raiz do projeto (onde está manage.py)
# Exemplo: /home/usuario/projeto/escola/
BASE_DIR = Path(__file__).resolve().parent.parent


# ========================
# VALIDADORES DE SENHA
# ========================
# Define regras de validação de senhas
# Cada validador bloqueia senhas fracas (muito similares ao username, muito curtas, etc)
AUTH_PASSWORD_VALIDATORS = [
    {
        # Bloqueia senhas muito similares ao username/email
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        # Exige mínimo de caracteres (padrão: 8)
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        # Bloqueia senhas muito comuns (123456, password, etc)
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        # Bloqueia senhas só com números
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# ========================
# SEGURANÇA
# ========================
# SECURITY WARNING: Mude isso em produção!
# A chave secreta é usada para assinar cookies, CSRF tokens, etc
# NUNCA exponha a chave secreta em repositórios públicos
SECRET_KEY = 'django-insecure-sua-chave-secreta-aqui'

# DEBUG = True: mostra stack traces detalhados em caso de erro (útil para desenvolvimento)
# SECURITY WARNING: defina como False em produção!
DEBUG = True

# ALLOWED_HOSTS: lista de domínios que podem acessar esta aplicação
# 127.0.0.1 = localhost (computador local)
# * em produção significaria aceitar qualquer host (INSEGURO)
ALLOWED_HOSTS = ['127.0.0.1', 'localhost']


# ========================
# CORS (Cross-Origin Resource Sharing)
# ========================
# Permite que o frontend (React/Vite) acesse a API do backend
# CORS_ALLOWED_ORIGINS: lista de origens (URLs) que podem fazer requisições para esta API
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # URL padrão do Vite (frontend local)
    # Em produção: adicionar URL do frontend publicado
]

# Permite envio de cookies/credenciais em requisições CORS
# Necessário para manter sessão autenticada entre frontend e backend
CORS_ALLOW_CREDENTIALS = True

# Headers HTTP permitidos em requisições CORS
CORS_ALLOW_HEADERS = [
    'accept',             # Tipo de conteúdo aceito
    'accept-encoding',    # Compressão aceita (gzip, deflate)
    'authorization',      # Header de autenticação (Bearer token, etc)
    'content-type',       # Tipo de conteúdo enviado (JSON, form, etc)
    'dnt',                # Do Not Track (privacidade do usuário)
    'origin',             # Origem da requisição
    'user-agent',         # Identificação do navegador/cliente
    'x-csrftoken',        # Token CSRF (proteção contra CSRF)
    'x-requested-with',   # Indica que é XmlHttpRequest
]


# ========================
# BANCO DE DADOS
# ========================
# Usa SQLite (arquivo local db.sqlite3) para desenvolvimento
# Em produção: use PostgreSQL, MySQL, ou outro banco robusto
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',  # Driver SQLite
        'NAME': BASE_DIR / 'db.sqlite3',         # Caminho do arquivo do banco
    }
}

# URL para arquivos estáticos (CSS, JS, imagens)
STATIC_URL = 'static/'

# --- CONFIGURAÇÃO FINAL E CORRETA DOS TEMPLATES ---
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        # Diz ao Django para procurar na pasta "templates" na raiz do projeto
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        # Diz ao Django para procurar na pasta "templates" de cada app
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

INSTALLED_APPS = [
    'jazzmin',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Apps de terceiros
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',

    # Suas aplicações
    'escola.base',
    'escola.coordenacao',
    'escola.disciplinar',
    'escola.pedagogico',
    'escola.biblioteca',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware', 
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'escola.urls'

WSGI_APPLICATION = 'escola.wsgi.application'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
}

AUTH_USER_MODEL = 'base.Usuario'
LOGIN_REDIRECT_URL = '/'
LOGOUT_REDIRECT_URL = '/'

# ========================
# CONFIGURAÇÃO DE E-MAIL
# ========================
# DESENVOLVIMENTO: usar console (mostra no terminal)
# PRODUÇÃO: usar SMTP real (descomente abaixo)

# --- DESENVOLVIMENTO (atual) ---
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# --- PRODUÇÃO (comentado, ative quando necessário) ---
# EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
# EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
# EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
# EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True') == 'True'
# EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', 'seu-email@gmail.com')
# EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', 'sua-senha-app')
# DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER)