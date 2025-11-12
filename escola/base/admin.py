# Em: escola/base/admin.py
"""
Configuração do Django admin para o modelo Usuario.
Customiza a interface de administração para gerenciar usuários com campos específicos.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin  # Herança da classe base de admin para usuários
from .forms import CustomUserCreationForm, CustomUserChangeForm  # Formulários customizados
from .models import Usuario  # Modelo de usuário customizado


# ========================
# ADMIN PARA O MODELO USUARIO
# ========================
class UsuarioAdmin(UserAdmin):
    """
    Classe que customiza a interface de administração do Django para o modelo Usuario.
    
    Herança: UserAdmin (Django built-in)
    - UserAdmin fornece layout padrão para gerenciar usuários (lista, criação, edição)
    
    Customizações:
    - Usa formulários customizados (CustomUserCreationForm, CustomUserChangeForm)
    - Adiciona campo 'cargo' ao layout
    - Define quais colunas aparecem na lista de usuários
    """
    
    # ========================
    # FORMULÁRIOS CUSTOMIZADOS
    # ========================
    # add_form: formulário usado quando CRIANDO um novo usuário (página "Add user")
    add_form = CustomUserCreationForm
    
    # form: formulário usado quando EDITANDO um usuário existente (página "Edit user")
    form = CustomUserChangeForm
    
    # model: especifica qual modelo este admin gerencia
    model = Usuario
    
    
    # ========================
    # CONFIGURAÇÃO DA LISTA DE USUÁRIOS
    # ========================
    # list_display: define quais colunas aparecem quando visualizando a lista de usuários
    # Cada coluna pode ser: nome de campo do modelo, ou método customizado
    list_display = [
        'username',      # Nome de usuário
        'email',         # Email (customizado)
        'first_name',    # Primeiro nome
        'last_name',     # Sobrenome
        'cargo',         # Cargo/papel (customizado)
        'is_staff'       # Se é staff (pode acessar admin)
    ]
    
    
    # ========================
    # LAYOUT DA PÁGINA DE EDIÇÃO (EDIT USER)
    # ========================
    # fieldsets: agrupa campos em seções na página de edição
    # Cada tupla: (nome_da_seção, {'fields': [...], 'classes': [...]})
    #
    # UserAdmin.fieldsets já possui seções padrão (Permissions, Important dates, etc)
    # Aqui adicionamos uma nova seção para campos customizados
    fieldsets = UserAdmin.fieldsets + (
        ('Informações Customizadas', {  # Nome da nova seção
            'fields': ('cargo',)  # Campos que aparecem nesta seção
        }),
    )
    
    
    # ========================
    # LAYOUT DA PÁGINA DE CRIAÇÃO (ADD USER)
    # ========================
    # add_fieldsets: agrupa campos especificamente na página de CRIAÇÃO de novo usuário
    # (diferente de fieldsets que é para EDIÇÃO)
    #
    # Nota: Os nomes de campos de senha devem ser 'password1' e 'password2'
    # (não 'password') pois o UserCreationForm espera esses nomes
    add_fieldsets = (
        (None, {  # Seção sem título (None = sem cabeçalho)
            'classes': ('wide',),  # CSS class para estilo (wide = formulário largo)
            'fields': (
                'username',    # Nome de usuário (identificador único)
                'email',       # Email (customizado, único)
                'first_name',  # Primeiro nome do usuário
                'last_name',   # Sobrenome do usuário
                'cargo',       # Cargo/papel (customizado)
                'password1',   # Primeira senha (será validada)
                'password2',   # Confirmação de senha (deve ser igual a password1)
            ),
        }),
    )

    
    # ========================
    # MÉTODO PARA ALTERNANÇA DE LAYOUT
    # ========================
    def get_fieldsets(self, request, obj=None):
        """
        Define quais fieldsets mostrar na página de formulário (criação ou edição).
        
        Args:
            request: Requisição HTTP
            obj: O objeto Usuario sendo editado (None se criando novo usuário)
        
        Retorna:
            add_fieldsets se obj é None (criando novo usuário)
            fieldsets padrão se obj existe (editando usuário existente)
            
        Motivo:
            A página de criação mostra apenas os campos necessários para criar (password1, password2)
            A página de edição mostra campos adicionais (permissões, grupos, datas, etc)
        """
        # Se obj é None, significa que estamos na página "Add user" (criação)
        if not obj:
            # Retorna o layout de criação (add_fieldsets)
            return self.add_fieldsets
        
        # Caso contrário, obj existe = estamos editando um usuário
        # Retorna o layout padrão (fieldsets) herdado da classe parent
        return super().get_fieldsets(request, obj)


# ========================
# REGISTRO DO ADMIN
# ========================
# Registra o modelo Usuario no Django admin com a classe UsuarioAdmin customizada
# Parâmetros: (modelo, classe_admin)
admin.site.register(Usuario, UsuarioAdmin)