# Em: escola/base/urls.py
"""
Rotas (URLs) do app 'base'.
Mapeia endpoints da API e páginas web para as respectivas views.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter  # Gerador automático de rotas REST
from .views import (
    home,                        # View de página home
    registrar,                   # View de registro de novo usuário
    UserViewSet,                 # ViewSet REST para CRUD de usuários
    dashboard_data,              # Endpoint para dados do dashboard
    CustomAuthToken,             # View de login com token
    password_reset_request,      # Endpoint para solicitar código de recuperação
    password_reset_login         # Endpoint para fazer login com código
)

# ========================
# ROTEADOR REST AUTOMÁTICO
# ========================
# DefaultRouter gera rotas CRUD automaticamente para ViewSets
# Para UserViewSet, gera:
#   GET    /api/users/             → list
#   POST   /api/users/             → create
#   GET    /api/users/<id>/        → retrieve
#   PUT    /api/users/<id>/        → update
#   PATCH  /api/users/<id>/        → partial_update
#   DELETE /api/users/<id>/        → destroy
#   GET    /api/users/me/          → custom action 'me'
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

# ========================
# DEFINIÇÃO DE ROTAS
# ========================
urlpatterns = [
    # === ROTAS REST (API) ===
    # Inclui as rotas geradas pelo router (endpoints /api/users/, etc)
    path('api/', include(router.urls)),
    
    # Endpoint para obter dados do dashboard
    # GET /api/dashboard/
    path('api/dashboard/', dashboard_data, name='dashboard_data'),
    
    # Endpoint de login com username/password
    # POST /api/login/
    # Retorna: { "token": "...", "user": {...} }
    path('api/login/', CustomAuthToken.as_view(), name='api_login'),
    
    # Endpoint para solicitar código de recuperação de senha
    # POST /api/password-reset/
    # Dados: { "email": "usuario@example.com" }
    # Retorna: { "sucesso": "..." } ou { "erro": "..." }
    path('api/password-reset/', password_reset_request, name='password_reset_request'),
    
    # Endpoint para fazer login usando código de recuperação
    # POST /api/password-reset-login/
    # Dados: { "email": "usuario@example.com", "code": "123456" }
    # Retorna: { "token": "...", "user": {...} }
    path('api/password-reset-login/', password_reset_login, name='password_reset_login'),

    # === ROTAS WEB (HTML) ===
    # Página home
    # GET /
    path('', home, name='home'),
    
    # Página de registro de novo usuário
    # GET /registrar/ → formulário
    # POST /registrar/ → processar formulário
    path('registrar/', registrar, name='registrar'),
]