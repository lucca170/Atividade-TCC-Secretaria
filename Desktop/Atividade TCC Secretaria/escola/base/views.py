# Em: escola/base/views.py
"""
Views (controladores) do app 'base'.
Implementa:
- Página home
- Registro de novos usuários
- API REST para gerenciar usuários
- Endpoints de autenticação (token)
- Sistema de "Esqueci Senha" com código por e-mail
"""

# ========================
# IMPORTAÇÕES - DJANGO
# ========================
from django.shortcuts import render, redirect, get_object_or_404  # Renderizar templates, redirecionar
from django.contrib.auth.forms import UserCreationForm              # Form padrão do Django
from django.contrib.auth import login, authenticate, get_user_model  # Autenticação e gerenciar usuários
from django.contrib.auth.decorators import login_required           # Decorator para exigir login
from django.views.generic import ListView                           # View baseada em classe
from django.urls import reverse_lazy                                # URL reversa (evita hardcode)
from django.db.models import Count, Avg                             # Agregações de banco de dados
from django.http import JsonResponse, HttpResponse                  # Respostas HTTP
from django.template.loader import render_to_string                 # Renderizar template para string
from django.core.cache import cache                                 # Cache em memória (temporário)
from django.core.mail import send_mail                              # Enviar e-mails
import os
import random
import string

# ========================
# IMPORTAÇÕES - Django REST Framework
# ========================
from rest_framework import viewsets, permissions, status            # Framework de API REST
from rest_framework.decorators import api_view, permission_classes, action  # Decoradores para funções API
from rest_framework.permissions import IsAuthenticated, AllowAny    # Permissões de API
from rest_framework.response import Response                        # Resposta JSON
from rest_framework.authtoken.views import ObtainAuthToken         # View de obtenção de token
from rest_framework.authtoken.models import Token                  # Modelo de token

# ========================
# IMPORTAÇÕES - LOCAIS (do projeto)
# ========================
from .serializers import CustomAuthTokenSerializer, UserSerializer  # Serializadores (conversion modelo → JSON)
from .forms import CustomUserCreationForm                           # Form customizado de usuário
from .permissions import IsCoordenacao                              # Permissão customizada

# Obtém o modelo de usuário customizado (Usuario)
# get_user_model() é a forma recomendada (permite swapping do modelo)
User = get_user_model()


# ========================
# VIEW FUNCTION - HOME
# ========================
def home(request):
    """
    Renderiza a página home/base da aplicação.
    
    GET:
    - Renderiza o template base.html
    
    Acessível por: /
    """
    return render(request, 'base/base.html')


# ========================
# VIEW FUNCTION - REGISTRO
# ========================
def registrar(request):
    """
    View para registro/criação de novo usuário.
    
    GET:
    - Renderiza o formulário de registro (HTML form)
    
    POST:
    - Processa o envio do formulário
    - Cria novo usuário se dados forem válidos
    - Faz login automático do novo usuário
    - Redireciona para home
    
    Form: CustomUserCreationForm
    Template: base/registrar.html
    
    Dados esperados (POST):
    - username: nome de usuário (único)
    - email: email (único)
    - first_name: primeiro nome
    - last_name: sobrenome
    - cargo: cargo/papel do usuário
    - password1: senha
    - password2: confirmação de senha (deve ser igual a password1)
    """
    if request.method == 'POST':
        # Cria formulário com dados do POST
        form = CustomUserCreationForm(request.POST)
        
        if form.is_valid():  # Valida dados (senhas, email único, etc)
            # Salva o novo usuário no banco
            user = form.save()
            
            # Loga o novo usuário automaticamente
            login(request, user)
            
            # Redireciona para home
            return redirect('home')
    else:
        # GET: exibe um formulário vazio
        form = CustomUserCreationForm()
    
    # Renderiza o template com o formulário (vazio no GET, com erros no POST inválido)
    return render(request, 'base/registrar.html', {'form': form})


# ========================
# VIEWSET - USUARIOS (API REST)
# ========================
class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet REST para CRUD de usuários.
    Fornece endpoints:
    - GET /api/usuarios/          → lista usuários
    - GET /api/usuarios/<id>/     → detalhes de 1 usuário
    - POST /api/usuarios/         → criar usuário
    - PUT /api/usuarios/<id>/     → atualizar usuário
    - DELETE /api/usuarios/<id>/  → deletar usuário
    - GET /api/usuarios/me/       → dados do usuário logado
    
    Permissões:
    - Exige IsAuthenticated (usuário deve estar logado)
    - Exige IsCoordenacao (apenas coordenadores/admins podem acessar)
    
    Filtros:
    - ?cargo=professor : filtra por cargo
    """
    
    serializer_class = UserSerializer  # Converte modelo → JSON
    permission_classes = [permissions.IsAuthenticated, IsCoordenacao]  # Permissões obrigatórias

    def get_queryset(self):
        """
        Retorna a lista de usuários que essa view pode retornar.
        
        Filtros suportados:
        - ?cargo=professor : filtra usuários por cargo
        
        Exemplo: GET /api/usuarios/?cargo=aluno
        """
        # Começa com todos os usuários, ordenados por primeiro nome
        queryset = User.objects.all().order_by('first_name')
        
        # Se foi passado um filtro de cargo na query string, aplica
        cargo = self.request.query_params.get('cargo')
        if cargo:
            queryset = queryset.filter(cargo=cargo)
        
        return queryset

    def create(self, request, *args, **kwargs):
        """
        Cria um novo usuário (POST /api/usuarios/).
        
        Dados esperados (JSON):
        {
            "username": "novousuario",
            "email": "novo@example.com",
            "first_name": "Novo",
            "last_name": "Usuario",
            "cargo": "professor"
        }
        
        Resposta:
        - Status 201 (Created)
        - Retorna dados do usuário + senha temporária (gerada aleatoriamente)
        
        Comportamento especial:
        - Gera uma senha aleatória de 8 caracteres (maiúsculas + dígitos)
        - Retorna a senha temporária para que o admin a passe para o usuário
        - Não pede password no POST (é gerada automaticamente)
        """
        # Serializador valida os dados recebidos
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)  # Lança erro se inválido
        
        # Gera uma senha temporária aleatória de 8 caracteres
        password = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        
        # Extrai dados validados do serializador
        validated_data = serializer.validated_data
        
        # Cria o usuário no banco de dados
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            cargo=validated_data.get('cargo'),
            password=password  # Usa a senha temporária gerada
        )
        
        # Prepara resposta: dados do usuário + senha temporária
        response_data = UserSerializer(user).data
        response_data['temp_password'] = password  # Adiciona a senha ao retorno
        
        # Headers padrão de resposta REST (Location, etc)
        headers = self.get_success_headers(response_data)
        
        # Retorna resposta 201 Created
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        Action customizada para obter dados do usuário logado.
        
        GET /api/usuarios/me/
        
        Retorna:
        - Dados do usuário logado (request.user)
        
        Permissão:
        - Exige apenas IsAuthenticated (qualquer usuário logado pode usar)
        """
        # Serializa o usuário logado
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


# ========================
# VIEW FUNCTION - DASHBOARD DATA (API)
# ========================
@api_view(['GET'])  # Apenas GET é suportado
@permission_classes([IsAuthenticated, IsCoordenacao])  # Exige login e cargo=coordenador/admin
def dashboard_data(request):
    """
    Endpoint para obter dados do dashboard (resumo da escola).
    
    GET /api/dashboard-data/
    
    Retorna (JSON):
    {
        "total_alunos": 150,
        "total_professores": 25,
        "total_turmas": 10,
        "evasao_percentual": 2.5,
        "media_geral_escola": 7.3
    }
    
    Permissão:
    - Exige IsAuthenticated (usuário logado)
    - Exige IsCoordenacao (coordenador ou admin)
    
    Nota:
    - Atualmente alguns dados estão hardcoded como 0/0
    - Podem ser conectados a modelos reais posteriormente
    """
    # Conta total de alunos no sistema
    total_alunos = User.objects.filter(cargo='aluno').count()
    
    # Conta total de professores no sistema
    total_professores = User.objects.filter(cargo='professor').count()
    
    # Dados ainda não implementados (retornam 0)
    total_turmas = 0
    evasao_percentual = 0
    media_geral_escola = 0

    # Monta resposta como dicionário
    data = {
        'total_alunos': total_alunos,
        'total_professores': total_professores,
        'total_turmas': total_turmas,
        'evasao_percentual': evasao_percentual,
        'media_geral_escola': media_geral_escola,
    }
    
    # Retorna resposta JSON
    return Response(data)


# ========================
# VIEW CLASS - AUTENTICACAO COM TOKEN
# ========================
class CustomAuthToken(ObtainAuthToken):
    """
    View customizada para obter token de autenticação.
    
    POST /api/token-auth/ (ou /api/auth/)
    
    Dados esperados (JSON):
    {
        "username": "usuario",
        "password": "senha"
    }
    
    Retorna (JSON):
    {
        "token": "abc123...",
        "user": { ...dados do usuário... }
    }
    
    Uso:
    - Cliente envia username + password
    - Servidor valida e retorna um token
    - Cliente usa este token para requisições autenticadas:
      Header: Authorization: Token abc123...
    
    Diferença do Django padrão:
    - ObtainAuthToken padrão só retorna o token
    - Este também retorna os dados do usuário
    """
    # Usa o serializador customizado para validação
    serializer_class = CustomAuthTokenSerializer
    
    def post(self, request, *args, **kwargs):
        """
        POST: autentica e retorna token.
        """
        # Valida username e password
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Extrai o usuário validado
        user = serializer.validated_data['user']
        
        # Obtém ou cria o token para este usuário
        # get_or_create = traz um existente ou cria novo
        token, created = Token.objects.get_or_create(user=user)
        
        # Serializa dados do usuário
        user_data = UserSerializer(user).data
        
        # Retorna resposta com token e dados do usuário
        return Response({
            'token': token.key,  # Chave do token
            'user': user_data    # Dados do usuário
        })


# ========================
# ENDPOINT DE "ESQUECI SENHA" - PARTE 1: SOLICITAR CÓDIGO
# ========================
@api_view(['POST'])  # Apenas POST é suportado
@permission_classes([AllowAny])  # Não precisa estar logado
def password_reset_request(request):
    """
    Endpoint para solicitar código de recuperação de senha.
    
    POST /api/password-reset/
    
    Dados esperados (JSON):
    {
        "email": "usuario@example.com"
    }
    
    Processo:
    1. Cliente envia e-mail
    2. Servidor verifica se e-mail existe
    3. Servidor gera código aleatório de 6 dígitos
    4. Servidor envia código por e-mail
    5. Responde com mensagem de sucesso
    
    Segurança:
    - Não revela se e-mail existe ou não (mesmo resposta em ambos casos)
    - Código expira em 10 minutos
    - Código armazenado no cache (não no banco)
    
    Retorna (JSON):
    {
        "sucesso": "Se um usuário com este e-mail existir, um código foi enviado."
    }
    """
    # Extrai o e-mail do corpo da requisição
    email = request.data.get('email')
    
    # Valida se e-mail foi fornecido
    if not email:
        return Response(
            {'erro': 'E-mail é obrigatório'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Procura usuário com este e-mail (__iexact = case-insensitive)
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        # E-mail não existe: retorna resposta genérica (segurança)
        # Não revela que o usuário não existe
        return Response(
            {'sucesso': 'Se um usuário com este e-mail existir, um código foi enviado.'},
            status=status.HTTP_200_OK
        )

    # 1. Gera código aleatório de 6 dígitos (100000 a 999999)
    code = str(random.randint(100000, 999999))
    
    # 2. Salva o código no cache por 10 minutos
    # Chave: "reset_code_email@example.com"
    # timeout=600 segundos = 10 minutos (depois expira)
    cache.set(f"reset_code_{user.email}", code, timeout=600)

    # 3. Monta conteúdo do e-mail
    assunto = "Código de Recuperação - Secretaria Web"
    mensagem = (
        f"Olá {user.first_name or user.username},\n\n"
        f"Seu código de login de uso único é:\n\n"
        f"--- {code} ---\n\n"
        f"Este código expira em 10 minutos.\n"
        f"Se você não solicitou isso, por favor, ignore este e-mail.\n"
    )

    try:
        # 4. Envia o e-mail
        send_mail(
            assunto,
            mensagem,
            os.environ.get('EMAIL_HOST_USER'),  # Remetente (configurado nas variáveis de ambiente)
            [user.email],  # Destinatário
            fail_silently=False,  # Levanta exceção se falhar
        )
        
        # Retorna sucesso
        return Response(
            {'sucesso': 'Se um usuário com este e-mail existir, um código foi enviado.'},
            status=status.HTTP_200_OK
        )
    
    except Exception as e:
        # Se houver erro ao enviar e-mail
        return Response(
            {'erro': f'Erro ao enviar e-mail: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ========================
# ENDPOINT DE "ESQUECI SENHA" - PARTE 2: VALIDAR CÓDIGO E FAZER LOGIN
# ========================
@api_view(['POST'])  # Apenas POST é suportado
@permission_classes([AllowAny])  # Não precisa estar logado
def password_reset_login(request):
    """
    Endpoint para validar código e fazer login.
    
    POST /api/password-reset-login/
    
    Dados esperados (JSON):
    {
        "email": "usuario@example.com",
        "code": "123456"
    }
    
    Processo:
    1. Cliente envia e-mail + código (recebido por e-mail)
    2. Servidor verifica se código existe no cache
    3. Servidor verifica se código é válido
    4. Servidor cria/retorna token de autenticação
    5. Cliente usa token para fazer login
    
    Retorna (JSON) se sucesso:
    {
        "token": "abc123...",
        "user": { ...dados do usuário... }
    }
    
    Erros possíveis:
    - Código expirado (passou 10 minutos)
    - Código incorreto
    - E-mail não existe
    """
    # Extrai dados da requisição
    email = request.data.get('email')
    code = request.data.get('code')

    # Valida se ambos foram fornecidos
    if not email or not code:
        return Response(
            {'erro': 'E-mail e código são obrigatórios'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Procura usuário com este e-mail
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        # E-mail não existe
        return Response(
            {'erro': 'Código ou e-mail inválido.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # 1. Busca o código no cache
    # A chave deve corresponder à usada em password_reset_request
    cached_code = cache.get(f"reset_code_{user.email}")

    # 2. Verifica se código foi encontrado (não expirou)
    if not cached_code:
        return Response(
            {'erro': 'Código expirado. Por favor, tente novamente.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # 3. Verifica se código coincide com o fornecido (str() para garantir comparação)
    if str(cached_code) != str(code):
        return Response(
            {'erro': 'Código ou e-mail inválido.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # ✅ Código está correto! Proceder com login

    # 4. Deleta o código do cache para não ser reutilizado
    cache.delete(f"reset_code_{user.email}")

    # 5. Cria ou obtém token de autenticação para o usuário
    token, created = Token.objects.get_or_create(user=user)
    
    # 6. Serializa dados do usuário
    user_data = UserSerializer(user).data

    # 7. Retorna a mesma resposta que um login normal
    return Response({
        'token': token.key,
        'user': user_data
    }, status=status.HTTP_200_OK)